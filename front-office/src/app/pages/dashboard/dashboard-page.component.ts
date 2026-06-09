import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { BookingResponse } from '../../models/booking.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);

  // ── Sent requests ─────────────────────────────────────────────────────────
  myBookings: BookingResponse[] = [];
  isLoadingSentBookings = false;

  /** Observable stream of the currently authenticated user. */
  currentUser$ = this.authService.currentUser$;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadSentBookings();
  }

  loadSentBookings(): void {
    this.isLoadingSentBookings = true;
    this.tripService.getMyBookings().subscribe({
      next: (b) => { this.myBookings = b; this.isLoadingSentBookings = false; },
      error: () => { this.isLoadingSentBookings = false; },
    });
  }

  cancelMyBooking(booking: BookingResponse): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    this.tripService.cancelBooking(booking.tripId, booking.id).subscribe({
      next: (updated) => {
        const idx = this.myBookings.findIndex((b) => b.id === updated.id);
        if (idx >= 0) { this.myBookings[idx] = updated; }
      },
      error: () => { /* no-op: UX handled by status staying unchanged */ },
    });
  }

  statusLabel(status: string): string {
    return ({ PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée', CANCELLED: 'Annulée', REMOVED: 'Retirée', DELIVERED: 'Remise confirmée' } as Record<string, string>)[status] ?? status;
  }

  statusClass(status: string): string {
    return ({ PENDING: 'bg-yellow-100 text-yellow-800', ACCEPTED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800', CANCELLED: 'bg-gray-100 text-gray-500', REMOVED: 'bg-slate-100 text-slate-600', DELIVERED: 'bg-secondary/10 text-secondary' } as Record<string, string>)[status] ?? 'bg-gray-100 text-gray-800';
  }

  validationChannelLabel(channel?: string): string {
    return channel === 'SMS' ? 'SMS' : 'e-mail';
  }
}
