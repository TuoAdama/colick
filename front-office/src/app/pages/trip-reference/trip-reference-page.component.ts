import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Trip } from '../../models/trip.model';
import { UserResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { SeoService } from '../../services/seo.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-trip-reference-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UserAvatarComponent],
  templateUrl: './trip-reference-page.component.html',
})
export class TripReferencePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripService = inject(TripService);
  private readonly authService = inject(AuthService);
  private readonly messagingService = inject(MessagingService);
  private readonly seo = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private routeSubscription?: Subscription;

  trip: Trip | null = null;
  isLoading = true;
  errorMessage = '';
  actionErrorMessage = '';
  isContactingTraveler = false;
  selectedBookingWeight: number | null = 1;

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const reference = params.get('reference')?.trim() ?? '';
      if (!reference) {
        this.showNotFound();
        return;
      }

      this.loadTrip(reference);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  openBookingRequestPage(initialWeight: number | null = null): void {
    if (!this.trip || this.isOwnTrip()) {
      return;
    }
    void this.router.navigate(['/trips/ref', this.trip.reference, 'request'], {
      queryParams: {
        returnUrl: this.router.url,
        source: 'trip_reference',
        ...(initialWeight === null ? {} : { weight: initialWeight }),
      },
    });
  }

  contactTraveler(): void {
    if (!this.trip || this.isOwnTrip() || this.isContactingTraveler) {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.isContactingTraveler = true;
    this.actionErrorMessage = '';
    this.messagingService.createConversationDraft({
      tripId: this.trip.id,
      recipientId: this.trip.travelerId,
    }).subscribe({
      next: (conversation) => {
        this.isContactingTraveler = false;
        void this.router.navigate(['/messages'], { queryParams: { conversationId: conversation.id } });
      },
      error: () => {
        this.actionErrorMessage = 'Impossible de démarrer la conversation avec le voyageur.';
        this.isContactingTraveler = false;
      },
    });
  }

  updateSelectedBookingWeight(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.selectedBookingWeight = value === '' ? null : Number(value);
  }

  canSubmitBookingWeight(): boolean {
    return this.selectedBookingWeight !== null
      && Number.isFinite(this.selectedBookingWeight)
      && this.selectedBookingWeight >= 0.1
      && !!this.trip
      && this.selectedBookingWeight <= this.trip.availableWeight;
  }

  estimatedBookingPrice(): string {
    if (!this.trip || !this.canSubmitBookingWeight()) {
      return '—';
    }

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(this.selectedBookingWeight! * this.trip.pricePerKilo);
  }

  isOwnTrip(): boolean {
    const currentUser: UserResponse | null = this.authService.getUser();
    return !!this.trip && !!currentUser && currentUser.id === this.trip.travelerId;
  }

  hasTravelerRating(): boolean {
    return this.trip?.travelerRatingAverage !== null
      && this.trip?.travelerRatingAverage !== undefined
      && (this.trip?.travelerRatingCount ?? 0) > 0;
  }

  formatTravelerRatingAverage(): string {
    return (this.trip?.travelerRatingAverage ?? 0).toFixed(1);
  }

  formatDate(value?: string): string {
    if (!value) {
      return '';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  formatTime(value?: string): string {
    if (!value) {
      return '';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  private loadTrip(reference: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.actionErrorMessage = '';
    this.trip = null;

    this.tripService.getTripByReference(reference).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.selectedBookingWeight = trip.availableWeight > 0
          ? Math.min(1, trip.availableWeight)
          : null;
        this.isLoading = false;
        const routeLabel = `${trip.departureAddress} → ${trip.destination}`;
        this.seo.updateMetadata({
          title: `${routeLabel} | Coliclic`,
          description: `${routeLabel} le ${this.formatDate(trip.departureTime)} avec ${trip.travelerName}. ${trip.pricePerKilo} € / kg, ${trip.availableWeight} kg disponibles.`,
          type: 'article',
          structuredData: {
            '@context': 'https://schema.org', '@type': 'Trip', name: routeLabel,
            url: this.router.url.split(/[?#]/)[0], departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime, provider: { '@type': 'Person', name: trip.travelerName },
            offers: { '@type': 'Offer', price: trip.pricePerKilo, priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
          },
        });
        this.analytics.track('detail_opened', { detail_type: 'trip', trip_id: trip.id, trip_reference: trip.reference });
      },
      error: () => {
        this.showNotFound();
      },
    });
  }

  private showNotFound(): void {
    this.isLoading = false;
    this.trip = null;
    this.errorMessage = 'Cette annonce est introuvable ou n’est plus disponible.';
  }
}
