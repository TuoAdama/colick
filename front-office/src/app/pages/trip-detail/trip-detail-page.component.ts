import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, UrlTree } from '@angular/router';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { AnalyticsService } from '../../services/analytics.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-trip-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UserAvatarComponent],
  templateUrl: './trip-detail-page.component.html',
  styleUrl: './trip-detail-page.component.css',
})
export class TripDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(TripService);
  private readonly auth = inject(AuthService);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  trip: Trip | null = null;
  isLoading = true;
  returnUrl = '/search';
  source = 'trip_reference';

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(
      switchMap(([params, query]) => {
        this.isLoading = true;
        this.trip = null;
        const returnUrl = query.get('returnUrl')?.trim() ?? '';
        this.returnUrl = /^\/(?:search(?:[?#]|$)|(?:[?#]|$))/.test(returnUrl) ? returnUrl : '/search';
        const source = query.get('source');
        this.source = source === 'search_results' || source === 'landing_recommended' ? source : 'trip_reference';
        const reference = params.get('reference')?.trim();
        return reference ? this.service.getTripByReference(reference).pipe(catchError(() => of(null))) : of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(trip => {
      this.trip = trip;
      this.isLoading = false;
      if (!trip) return;
      this.analytics.track('detail_opened', { detail_type: 'trip', trip_id: trip.id, source: this.source });
    });

    this.auth.currentUser$.pipe(
      switchMap(user => user ? this.service.getMyBookings().pipe(catchError(() => of([]))) : of([])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(bookings => {
      this.bookings = bookings.filter(booking => booking.status === 'PENDING' || booking.status === 'ACCEPTED').map(booking => booking.tripId);
    });
  }

  private bookings: number[] = [];

  get returnLink(): UrlTree { return this.router.parseUrl(this.returnUrl); }

  get bookingLabel(): string {
    if (this.auth.getUser()?.id === this.trip?.travelerId) return 'Votre trajet';
    if (this.trip && this.bookings.includes(this.trip.id)) return 'Demande envoyée';
    if (this.trip?.status !== 'ACTIVE' || (this.trip?.availableWeight ?? 0) <= 0) return 'Trajet indisponible';
    return 'Réserver';
  }

  get canBook(): boolean { return !!this.trip?.reference && this.bookingLabel === 'Réserver'; }

  get hasRating(): boolean {
    return (this.trip?.travelerRatingCount ?? 0) > 0 && this.trip?.travelerRatingAverage != null;
  }

  formatRating(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  reserve(): void {
    if (!this.canBook || !this.trip?.reference) return;
    void this.router.navigate(['/trips/ref', this.trip.reference, 'request'], {
      queryParams: {
        returnUrl: this.router.url,
        resultsReturnUrl: /^\/search(?:[?#]|$)/.test(this.returnUrl) ? this.returnUrl : '/search',
        source: this.source,
      },
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatTime(value: string): string {
    return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatNumber(value: number): string { return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }); }
}
