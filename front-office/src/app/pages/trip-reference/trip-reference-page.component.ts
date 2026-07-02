import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { UserResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { BookingModalComponent } from '../../shared/components/booking-modal/booking-modal.component';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-trip-reference-page',
  standalone: true,
  imports: [CommonModule, RouterLink, BookingModalComponent, UserAvatarComponent],
  templateUrl: './trip-reference-page.component.html',
})
export class TripReferencePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripService = inject(TripService);
  private readonly authService = inject(AuthService);
  private routeSubscription?: Subscription;

  trip: Trip | null = null;
  isLoading = true;
  errorMessage = '';
  isBookingModalOpen = false;
  bookingSuccessMessage = '';

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

  openBookingModal(): void {
    if (!this.trip || this.isOwnTrip()) {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.isBookingModalOpen = true;
  }

  closeBookingModal(): void {
    this.isBookingModalOpen = false;
  }

  onBookingCreated(booking: BookingResponse): void {
    this.bookingSuccessMessage = `Demande envoyée avec succès pour "${booking.title}" !`;
    setTimeout(() => {
      this.bookingSuccessMessage = '';
    }, 5000);
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
    this.trip = null;

    this.tripService.getTripByReference(reference).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.isLoading = false;
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
