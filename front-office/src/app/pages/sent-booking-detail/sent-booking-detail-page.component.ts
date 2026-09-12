import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-sent-booking-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UserAvatarComponent],
  templateUrl: './sent-booking-detail-page.component.html',
})
export class SentBookingDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripService = inject(TripService);
  private readonly messagingService = inject(MessagingService);

  trip: Trip | null = null;
  booking: BookingResponse | null = null;
  isLoading = true;
  isProcessing = false;
  loadError = '';
  actionError = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tripId = Number(params.get('tripId'));
      const bookingId = Number(params.get('bookingId'));

      if (!Number.isInteger(tripId) || tripId <= 0 || !Number.isInteger(bookingId) || bookingId <= 0) {
        this.trip = null;
        this.booking = null;
        this.loadError = 'Impossible de charger le détail de cette demande.';
        this.isLoading = false;
        return;
      }

      this.loadDetail(tripId, bookingId);
    });
  }

  statusLabel(status: BookingResponse['status']): string {
    return ({
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
      CANCELLED: 'Annulée',
      REMOVED: 'Retirée',
    } as Record<BookingResponse['status'], string>)[status];
  }

  statusClass(status: BookingResponse['status']): string {
    return ({
      PENDING: 'bg-warning/10 text-warning',
      ACCEPTED: 'bg-success/10 text-success',
      REJECTED: 'bg-error/10 text-error',
      CANCELLED: 'bg-neutral/10 text-neutral',
      REMOVED: 'bg-neutral/10 text-text-secondary',
    } as Record<BookingResponse['status'], string>)[status];
  }

  canCancelBooking(): boolean {
    return !!this.booking && (this.booking.status === 'PENDING' || this.booking.status === 'ACCEPTED');
  }

  createdAtLabel(createdAt?: string): string | null {
    if (!createdAt) {
      return null;
    }

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  dateTimeLabel(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  travelerRatingLabel(): string | null {
    if (!this.trip?.travelerRatingAverage || !this.trip.travelerRatingCount) {
      return null;
    }

    const average = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(this.trip.travelerRatingAverage);

    return `${average} (${this.trip.travelerRatingCount} avis)`;
  }

  grossAmount(): number {
    if (!this.trip || !this.booking) {
      return 0;
    }

    return this.booking.weight * this.trip.pricePerKilo;
  }

  messageTraveler(): void {
    if (!this.trip || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.actionError = '';
    this.messagingService.createConversationDraft({
      tripId: this.trip.id,
      recipientId: this.trip.travelerId,
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

  cancelBooking(): void {
    if (!this.trip || !this.booking || !this.canCancelBooking() || this.isProcessing) {
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
      return;
    }

    this.isProcessing = true;
    this.actionError = '';
    this.tripService.cancelBooking(this.trip.id, this.booking.id).subscribe({
      next: (updatedBooking) => {
        this.booking = updatedBooking;
        this.isProcessing = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || "Impossible d'annuler cette demande pour le moment.";
        this.isProcessing = false;
      },
    });
  }

  private loadDetail(tripId: number, bookingId: number): void {
    this.isLoading = true;
    this.isProcessing = false;
    this.loadError = '';
    this.actionError = '';

    forkJoin({
      trip: this.tripService.getTripById(tripId),
      booking: this.tripService.getTripBookingById(tripId, bookingId),
    }).subscribe({
      next: ({ trip, booking }) => {
        this.trip = trip;
        this.booking = booking;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          void this.router.navigate(['/404']);
          return;
        }

        this.trip = null;
        this.booking = null;
        this.loadError = 'Impossible de charger le détail de cette demande.';
        this.isLoading = false;
      },
    });
  }
}
