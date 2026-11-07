import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { routeCity, routeCountry, sentBookingStatusLabel } from '../../shared/utils/sent-booking-presentation';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-sent-booking-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, UserAvatarComponent],
  templateUrl: './sent-booking-detail-page.component.html',
  styleUrls: ['../sent-bookings/sent-booking-layout.css', './sent-booking-detail-page.component.css'],
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
  photoMessage = '';

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

  readonly statusLabel = sentBookingStatusLabel;
  readonly routeCity = routeCity;
  readonly routeCountry = routeCountry;
  contactCopyFeedback = '';
  contactCopyFailed = false;
  isCopyingContact = false;

  isFreeBooking(): boolean {
    return this.booking?.commercialMode !== 'COMMISSION' && !(this.booking?.platformFeeRate && this.booking.platformFeeRate > 0);
  }

  phoneHref(contact: string): string | null {
    if (!/^\+?[0-9().\s-]{6,}$/.test(contact.trim())) return null;
    return `tel:${contact.replace(/[^0-9+]/g, '')}`;
  }

  async copyRecipientContact(): Promise<void> {
    const booking = this.booking;
    if (!booking?.recipientContact || this.isCopyingContact) return;
    this.isCopyingContact = true;
    this.contactCopyFeedback = '';
    this.contactCopyFailed = false;
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(booking.recipientContact);
      if (this.booking === booking) this.contactCopyFeedback = 'Contact copié.';
    } catch {
      if (this.booking === booking) {
        this.contactCopyFailed = true;
        this.contactCopyFeedback = 'Impossible de copier le contact. Vous pouvez le sélectionner manuellement.';
      }
    } finally {
      this.isCopyingContact = false;
    }
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
      month: 'short',
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
      month: 'short',
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

    return `${average} · ${this.trip.travelerRatingCount} avis`;
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

  retryPhotoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.trip || !this.booking || !this.canCancelBooking() || this.isProcessing) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.actionError = 'Choisissez une image JPEG, PNG ou WebP de 5 Mo maximum.';
      return;
    }
    this.isProcessing = true;
    this.actionError = '';
    this.photoMessage = '';
    this.tripService.uploadBookingPhoto(this.trip.id, this.booking.id, file).subscribe({
      next: booking => {
        this.booking = booking;
        this.isProcessing = false;
        this.photoMessage = 'La photo du colis a bien été ajoutée.';
      },
      error: error => {
        this.isProcessing = false;
        this.actionError = error?.error?.message || 'Impossible d’envoyer la photo.';
      },
    });
  }

  private loadDetail(tripId: number, bookingId: number): void {
    this.isLoading = true;
    this.isProcessing = false;
    this.loadError = '';
    this.actionError = '';
    this.photoMessage = '';
    this.contactCopyFeedback = '';

    forkJoin({
      trip: this.tripService.getTripById(tripId),
      booking: this.tripService.getMyTripBookingById(tripId, bookingId),
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
