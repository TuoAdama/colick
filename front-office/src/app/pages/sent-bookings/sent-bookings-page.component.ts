import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BookingResponse } from '../../models/booking.model';
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
  private readonly router = inject(Router);

  myBookings: BookingResponse[] = [];
  isLoadingBookings = false;
  actionError = '';
  cancellingBookingId: number | null = null;

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

  cancelBooking(booking: BookingResponse): void {
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
          this.myBookings[bookingIndex] = updatedBooking;
        }
        this.cancellingBookingId = null;
      },
      error: () => {
        this.actionError = "Impossible d'annuler cette demande pour le moment.";
        this.cancellingBookingId = null;
      },
    });
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
