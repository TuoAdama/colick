import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  BookingResponse,
  BookingSenderProfileResponse,
  BookingSenderReviewResponse,
} from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-reservation-sender-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reservation-sender-profile-page.component.html',
})
export class ReservationSenderProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripService = inject(TripService);
  private readonly messagingService = inject(MessagingService);

  trip: Trip | null = null;
  booking: BookingResponse | null = null;
  senderProfile: BookingSenderProfileResponse | null = null;
  isLoading = true;
  isProcessing = false;
  loadError = '';
  actionError = '';

  private senderPhotoLoadFailed = false;
  private lastSenderPhotoUrl: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tripId = Number(params.get('tripId'));
      const bookingId = Number(params.get('bookingId'));

      if (!Number.isInteger(tripId) || tripId <= 0 || !Number.isInteger(bookingId) || bookingId <= 0) {
        this.trip = null;
        this.booking = null;
        this.loadError = 'Impossible de charger ce profil utilisateur.';
        this.isLoading = false;
        return;
      }

      this.loadSenderProfile(tripId, bookingId);
    });
  }

  senderName(): string {
    return this.booking?.senderName ?? 'Profil utilisateur';
  }

  senderInitial(): string {
    return this.senderName().trim().charAt(0).toUpperCase() || '?';
  }

  senderPhotoUrl(): string | null {
    const photoUrl = this.booking?.senderPhotoUrl?.trim() ?? null;
    if (!photoUrl) {
      this.senderPhotoLoadFailed = false;
      this.lastSenderPhotoUrl = null;
      return null;
    }

    if (photoUrl !== this.lastSenderPhotoUrl) {
      this.senderPhotoLoadFailed = false;
      this.lastSenderPhotoUrl = photoUrl;
    }

    return this.senderPhotoLoadFailed ? null : photoUrl;
  }

  onSenderPhotoError(): void {
    this.senderPhotoLoadFailed = true;
  }

  hasSenderReviews(): boolean {
    return this.senderReviews().length > 0;
  }

  senderReviewAverage(): number {
    return this.senderProfile?.averageRating ?? this.booking?.senderRatingAverage ?? 0;
  }

  senderReviewAverageLabel(): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(this.senderReviewAverage());
  }

  senderReviewCount(): number {
    return this.senderProfile?.reviewCount ?? this.booking?.senderRatingCount ?? 0;
  }

  senderReviewCountLabel(): string {
    return `${this.senderReviewCount()} avis`;
  }

  profileDescription(): string {
    const description = this.booking?.description?.trim();
    if (description) {
      return description;
    }

    return 'Cet utilisateur n’a pas encore ajouté de description.';
  }

  completedTripsLabel(): string {
    return new Intl.NumberFormat('fr-FR').format(this.senderProfile?.completedTripCount ?? 0);
  }

  sentPackagesLabel(): string {
    return new Intl.NumberFormat('fr-FR').format(this.senderProfile?.sentPackageCount ?? 0);
  }

  senderReviews(): BookingSenderReviewResponse[] {
    return this.senderProfile?.reviews ?? [];
  }

  reviewStars(rating: number): number[] {
    const clampedRating = Math.max(0, Math.min(5, Math.round(rating)));
    return Array.from({ length: clampedRating }, (_, index) => index);
  }

  formattedReviewDate(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
    const [day = '', month = '', year = ''] = formattedDate.split(' ');
    const capitalizedMonth = month ? `${month.charAt(0).toUpperCase()}${month.slice(1)}` : '';

    return [day, capitalizedMonth, year].filter(Boolean).join(' ') || formattedDate;
  }

  messageSender(): void {
    if (!this.trip || !this.booking || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.actionError = '';
    this.messagingService.startConversation({
      tripId: this.trip.id,
      recipientId: this.booking.senderId,
      content:
        `Bonjour, je vous contacte au sujet de votre réservation "${this.booking.title}" `
        + `pour mon trajet ${this.trip.departureAddress} vers ${this.trip.destination}.`,
    }).subscribe({
      next: (conversation) => {
        this.isProcessing = false;
        void this.router.navigate(['/messages'], { queryParams: { conversationId: conversation.id } });
      },
      error: () => {
        this.actionError = 'Impossible de démarrer la conversation.';
        this.isProcessing = false;
      },
    });
  }

  private loadSenderProfile(tripId: number, bookingId: number): void {
    this.isLoading = true;
    this.isProcessing = false;
    this.loadError = '';
    this.actionError = '';
    this.senderProfile = null;

    forkJoin({
      trip: this.tripService.getTripById(tripId),
      bookings: this.tripService.getTripBookings(tripId),
      senderProfile: this.tripService.getBookingSenderProfile(tripId, bookingId),
    }).subscribe({
      next: ({ trip, bookings, senderProfile }) => {
        this.trip = trip;
        this.senderProfile = senderProfile;
        this.booking = bookings.find((currentBooking) => currentBooking.id === bookingId) ?? null;
        this.isLoading = false;

        if (!this.booking) {
          this.loadError = 'Impossible de retrouver ce profil pour cette réservation.';
        }
      },
      error: () => {
        this.trip = null;
        this.booking = null;
        this.senderProfile = null;
        this.loadError = 'Impossible de charger ce profil utilisateur.';
        this.isLoading = false;
      },
    });
  }
}
