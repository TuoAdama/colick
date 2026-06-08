import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-reservation-booking-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModalComponent],
  templateUrl: './reservation-booking-detail-page.component.html',
})
export class ReservationBookingDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly messagingService = inject(MessagingService);

  trip: Trip | null = null;
  booking: BookingResponse | null = null;
  isLoading = true;
  isProcessing = false;
  loadError = '';
  actionError = '';
  deliveryCode = '';
  isMobileMenuOpen = false;
  isRemoveBookingModalOpen = false;

  private profilePhotoLoadFailed = false;
  private lastProfilePhotoUrl: string | null = null;
  private senderPhotoLoadFailed = false;
  private lastSenderPhotoUrl: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tripId = Number(params.get('tripId'));
      const bookingId = Number(params.get('bookingId'));

      if (!Number.isInteger(tripId) || tripId <= 0 || !Number.isInteger(bookingId) || bookingId <= 0) {
        this.trip = null;
        this.booking = null;
        this.loadError = 'Impossible de charger les détails de cette réservation.';
        this.isLoading = false;
        return;
      }

      this.loadBookingDetail(tripId, bookingId);
    });
  }

  currentUserName(): string {
    const user = this.authService.getUser();
    const name = [user?.firstName?.trim(), user?.lastName?.trim()]
      .filter((value): value is string => !!value)
      .join(' ')
      .trim();

    return name || 'Mon espace';
  }

  currentUserEmail(): string {
    return this.authService.getUser()?.email ?? '';
  }

  hasUserPhoto(): boolean {
    return !!this.userPhotoUrl();
  }

  userPhotoUrl(): string | null {
    const photoUrl = this.authService.getUser()?.photoUrl?.trim() ?? null;
    if (!photoUrl) {
      this.profilePhotoLoadFailed = false;
      this.lastProfilePhotoUrl = null;
      return null;
    }

    if (photoUrl !== this.lastProfilePhotoUrl) {
      this.profilePhotoLoadFailed = false;
      this.lastProfilePhotoUrl = photoUrl;
    }

    return this.profilePhotoLoadFailed ? null : photoUrl;
  }

  userInitials(): string {
    const user = this.authService.getUser();
    const firstInitial = user?.firstName?.trim().charAt(0) ?? '';
    const lastInitial = user?.lastName?.trim().charAt(0) ?? '';
    const initials = `${firstInitial}${lastInitial}`.toUpperCase();

    if (initials) {
      return initials;
    }

    return user?.email?.trim().charAt(0).toUpperCase() ?? 'U';
  }

  onUserPhotoError(): void {
    this.profilePhotoLoadFailed = true;
  }

  logout(): void {
    this.authService.logout();
  }

  openMobileMenu(): void {
    this.isMobileMenuOpen = true;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  bookingStatusLabel(status: BookingResponse['status']): string {
    return ({
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
      CANCELLED: 'Annulée',
      REMOVED: 'Retirée',
    } as Record<BookingResponse['status'], string>)[status];
  }

  bookingStatusClass(status: BookingResponse['status']): string {
    return ({
      PENDING: 'bg-warning/10 text-warning',
      ACCEPTED: 'bg-success/10 text-success',
      REJECTED: 'bg-error/10 text-error',
      CANCELLED: 'bg-error/10 text-error',
      REMOVED: 'bg-background-primary text-text-muted',
    } as Record<BookingResponse['status'], string>)[status];
  }

  routeLocationLabel(location: string): string {
    return location.split(',')[0]?.trim() || location;
  }

  formattedDepartureDateTime(value?: string): string {
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
    const displayDate = [day, capitalizedMonth, year].filter(Boolean).join(' ');
    const formattedTime = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);

    return `${displayDate || formattedDate} • ${formattedTime}`;
  }

  senderInitial(): string {
    return this.booking?.senderName?.trim().charAt(0).toUpperCase() || '?';
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
    return this.booking?.senderRatingAverage !== null
      && this.booking?.senderRatingAverage !== undefined
      && (this.booking?.senderRatingCount ?? 0) > 0;
  }

  senderReviewAverageLabel(): string {
    const average = this.booking?.senderRatingAverage;
    if (average === null || average === undefined) {
      return '';
    }

    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(average);
  }

  senderReviewCountLabel(): string {
    return `${this.booking?.senderRatingCount ?? 0} avis`;
  }

  validationChannelLabel(channel?: BookingResponse['validationDeliveryChannel']): string {
    return channel === 'SMS' ? 'SMS' : 'e-mail';
  }

  grossAmount(): number {
    if (!this.trip || !this.booking) {
      return 0;
    }

    return this.booking.weight * this.trip.pricePerKilo;
  }

  platformCommission(): number {
    return this.grossAmount() * 0.07;
  }

  netAmount(): number {
    return this.grossAmount() - this.platformCommission();
  }

  canShowConfirmDelivery(): boolean {
    return !!this.trip
      && !!this.booking
      && this.trip.status === 'COMPLETED'
      && this.booking.status === 'ACCEPTED'
      && this.booking.validationCodeActive
      && !this.booking.deliveredAt;
  }

  canRemoveBooking(): boolean {
    return !!this.booking && this.booking.status === 'ACCEPTED' && !this.booking.deliveredAt;
  }

  acceptBooking(): void {
    if (!this.trip || !this.booking || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.actionError = '';
    this.tripService.acceptBooking(this.trip.id, this.booking.id).subscribe({
      next: (updatedBooking) => {
        this.updateBooking(updatedBooking);
        this.isProcessing = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || "Impossible d'accepter cette réservation.";
        this.isProcessing = false;
      },
    });
  }

  rejectBooking(): void {
    if (!this.trip || !this.booking || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.actionError = '';
    this.tripService.rejectBooking(this.trip.id, this.booking.id).subscribe({
      next: (updatedBooking) => {
        this.updateBooking(updatedBooking);
        this.isProcessing = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de refuser cette réservation.';
        this.isProcessing = false;
      },
    });
  }

  openRemoveBookingModal(): void {
    if (!this.canRemoveBooking() || this.isProcessing) {
      return;
    }

    this.isRemoveBookingModalOpen = true;
  }

  closeRemoveBookingModal(): void {
    this.isRemoveBookingModalOpen = false;
  }

  confirmRemoveBooking(): void {
    if (!this.trip || !this.booking || this.isProcessing) {
      return;
    }

    const tripId = this.trip.id;
    const bookingId = this.booking.id;
    this.isProcessing = true;
    this.actionError = '';
    this.tripService.removeBooking(tripId, bookingId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.isRemoveBookingModalOpen = false;
        void this.router.navigate(['/trips', tripId, 'reservations']);
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de retirer cette réservation.';
        this.isProcessing = false;
        this.isRemoveBookingModalOpen = false;
      },
    });
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
      next: () => {
        this.isProcessing = false;
        void this.router.navigate(['/messages']);
      },
      error: () => {
        this.actionError = 'Impossible de démarrer la conversation.';
        this.isProcessing = false;
      },
    });
  }

  confirmBookingDelivery(): void {
    if (!this.trip || !this.booking || this.isProcessing) {
      return;
    }

    const validationCode = this.deliveryCode.trim();
    if (!/^\d{6}$/.test(validationCode)) {
      this.actionError = 'Saisissez un code de validation à 6 chiffres.';
      return;
    }

    this.isProcessing = true;
    this.actionError = '';
    this.tripService.confirmBookingDelivery(this.trip.id, this.booking.id, { validationCode }).subscribe({
      next: (updatedBooking) => {
        this.updateBooking(updatedBooking);
        this.deliveryCode = '';
        this.isProcessing = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de confirmer la remise du colis.';
        this.isProcessing = false;
      },
    });
  }

  private loadBookingDetail(tripId: number, bookingId: number): void {
    this.isLoading = true;
    this.isProcessing = false;
    this.loadError = '';
    this.actionError = '';
    this.deliveryCode = '';
    this.closeRemoveBookingModal();

    forkJoin({
      trip: this.tripService.getTripById(tripId),
      bookings: this.tripService.getTripBookings(tripId),
    }).subscribe({
      next: ({ trip, bookings }) => {
        this.trip = trip;
        this.booking = bookings.find((currentBooking) => currentBooking.id === bookingId) ?? null;
        this.isLoading = false;

        if (!this.booking) {
          this.loadError = 'Impossible de retrouver cette réservation pour ce trajet.';
        }
      },
      error: () => {
        this.trip = null;
        this.booking = null;
        this.loadError = 'Impossible de charger les détails de cette réservation.';
        this.isLoading = false;
      },
    });
  }

  private updateBooking(updatedBooking: BookingResponse): void {
    this.booking = updatedBooking;
  }
}
