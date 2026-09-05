import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingResponse, SentBookingResponse } from '../../models/booking.model';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-sent-bookings-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sent-bookings-page.component.html',
})
export class SentBookingsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly messagingService = inject(MessagingService);
  private readonly router = inject(Router);

  myBookings: SentBookingResponse[] = [];
  isLoadingBookings = false;
  actionError = '';
  cancellingBookingId: number | null = null;
  messagingBookingId: number | null = null;
  copiedBookingId: number | null = null;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }

    this.loadMyBookings();
  }

  loadMyBookings(): void {
    this.isLoadingBookings = true;
    this.actionError = '';
    this.tripService.getMyBookings().subscribe({
      next: (bookings) => {
        this.myBookings = [...bookings].sort(
          (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
        this.isLoadingBookings = false;
      },
      error: () => {
        this.actionError = 'Impossible de charger vos demandes envoyees pour le moment.';
        this.isLoadingBookings = false;
      },
    });
  }

  canCancelBooking(booking: BookingResponse): boolean {
    return booking.status === 'PENDING' || booking.status === 'ACCEPTED';
  }

  cancelBooking(booking: SentBookingResponse, event?: Event): void {
    event?.stopPropagation();

    if (!this.canCancelBooking(booking) || this.cancellingBookingId !== null) {
      return;
    }

    if (!confirm('Etes-vous sur de vouloir annuler cette demande ?')) {
      return;
    }

    this.actionError = '';
    this.cancellingBookingId = booking.id;
    this.tripService.cancelBooking(booking.tripId, booking.id).subscribe({
      next: (updatedBooking) => {
        const bookingIndex = this.myBookings.findIndex((currentBooking) => currentBooking.id === updatedBooking.id);
        if (bookingIndex >= 0) {
          this.myBookings[bookingIndex] = { ...this.myBookings[bookingIndex], ...updatedBooking };
        }
        this.cancellingBookingId = null;
      },
      error: () => {
        this.actionError = "Impossible d'annuler cette demande pour le moment.";
        this.cancellingBookingId = null;
      },
    });
  }

  messageTraveler(booking: SentBookingResponse, event?: Event): void {
    event?.stopPropagation();
    if (this.messagingBookingId !== null) {
      return;
    }

    this.actionError = '';
    this.messagingBookingId = booking.id;
    this.messagingService.createConversationDraft({
      tripId: booking.tripId,
      recipientId: booking.travelerId,
    }).subscribe({
      next: (conversation) => {
        this.messagingBookingId = null;
        void this.router.navigate(['/messages'], { queryParams: { conversationId: conversation.id } });
      },
      error: () => {
        this.actionError = 'Impossible de démarrer la conversation avec le voyageur.';
        this.messagingBookingId = null;
      },
    });
  }

  copyRecipientContact(booking: SentBookingResponse, event?: Event): void {
    event?.stopPropagation();
    if (!navigator.clipboard) {
      this.actionError = 'La copie du contact est indisponible sur cet appareil.';
      return;
    }

    void navigator.clipboard.writeText(booking.recipientContact).then(
      () => this.copiedBookingId = booking.id,
      () => this.actionError = 'Impossible de copier le contact pour le moment.',
    );
  }

  phoneHref(contact: string): string | null {
    if (!/^\+?[0-9().\s-]{6,}$/.test(contact.trim())) {
      return null;
    }

    return `tel:${contact.replace(/[^0-9+]/g, '')}`;
  }

  navigateToSentBookingDetail(booking: SentBookingResponse): void {
    void this.router.navigate(['/sent-bookings', booking.tripId, booking.id]);
  }

  statusLabel(status: BookingResponse['status']): string {
    return ({
      PENDING: 'En attente',
      ACCEPTED: 'Acceptee',
      REJECTED: 'Refusee',
      CANCELLED: 'Annulee',
      REMOVED: 'Retiree',
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

  createdAtLabel(createdAt?: string): string | null {
    if (!createdAt) {
      return null;
    }

    const createdAtDate = new Date(createdAt);
    if (Number.isNaN(createdAtDate.getTime())) {
      return null;
    }

    return createdAtDate.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
