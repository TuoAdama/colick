import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);

  currentUser$ = this.authService.currentUser$;

  // My trips (as traveler)
  myTrips: Trip[] = [];
  isLoadingTrips = false;

  // Sent bookings (as sender)
  myBookings: BookingResponse[] = [];
  isLoadingSentBookings = false;

  // Received bookings (bookings on my trips)
  receivedBookings: BookingResponse[] = [];
  isLoadingReceivedBookings = false;

  // Map tripId → Trip for earnings computation
  private tripsMap = new Map<number, Trip>();

  get activeTripsCount(): number {
    return this.myTrips.filter(t => t.status === 'ACTIVE').length;
  }

  get pendingReceivedCount(): number {
    return this.receivedBookings.filter(b => b.status === 'PENDING').length;
  }

  get totalEarnings(): number {
    return this.receivedBookings
      .filter(b => b.status === 'ACCEPTED' || b.deliveredAt)
      .reduce((sum, b) => {
        const trip = this.tripsMap.get(b.tripId);
        const pricePerKilo = trip?.pricePerKilo ?? 0;
        return sum + (b.weight * pricePerKilo);
      }, 0);
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadSentBookings();
    this.loadMyTrips();
  }

  loadSentBookings(): void {
    this.isLoadingSentBookings = true;
    this.tripService.getMyBookings().subscribe({
      next: (b) => { this.myBookings = b; this.isLoadingSentBookings = false; },
      error: () => { this.isLoadingSentBookings = false; },
    });
  }

  loadMyTrips(): void {
    this.isLoadingTrips = true;
    this.tripService.getMyTrips().subscribe({
      next: (trips) => {
        this.myTrips = trips;
        this.tripsMap = new Map(trips.map(t => [t.id, t]));
        this.isLoadingTrips = false;
        this.loadReceivedBookings(trips);
      },
      error: () => { this.isLoadingTrips = false; },
    });
  }

  loadReceivedBookings(trips: Trip[]): void {
    const activeTrips = trips.filter(t => t.status === 'ACTIVE');
    if (activeTrips.length === 0) {
      this.receivedBookings = [];
      return;
    }
    this.isLoadingReceivedBookings = true;
    const requests = activeTrips.map(t => this.tripService.getTripBookings(t.id));
    forkJoin(requests).subscribe({
      next: (results) => {
        this.receivedBookings = results.flat();
        this.isLoadingReceivedBookings = false;
      },
      error: () => { this.isLoadingReceivedBookings = false; },
    });
  }

  cancelMyBooking(booking: BookingResponse): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;
    this.tripService.cancelBooking(booking.tripId, booking.id).subscribe({
      next: (updated) => {
        const idx = this.myBookings.findIndex((b) => b.id === updated.id);
        if (idx >= 0) { this.myBookings[idx] = updated; }
      },
      error: () => { /* no-op */ },
    });
  }

  acceptReceivedBooking(booking: BookingResponse): void {
    this.tripService.acceptBooking(booking.tripId, booking.id).subscribe({
      next: (updated) => {
        const idx = this.receivedBookings.findIndex(b => b.id === updated.id);
        if (idx >= 0) { this.receivedBookings[idx] = updated; }
      },
      error: () => { /* no-op */ },
    });
  }

  rejectReceivedBooking(booking: BookingResponse): void {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette demande ?')) return;
    this.tripService.rejectBooking(booking.tripId, booking.id).subscribe({
      next: (updated) => {
        const idx = this.receivedBookings.findIndex(b => b.id === updated.id);
        if (idx >= 0) { this.receivedBookings[idx] = updated; }
      },
      error: () => { /* no-op */ },
    });
  }

  statusLabel(status: string): string {
    return ({
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
      CANCELLED: 'Annulée',
      REMOVED: 'Retirée',
    } as Record<string, string>)[status] ?? status;
  }

  statusClass(status: string): string {
    return ({
      PENDING: 'bg-warning/10 text-warning',
      ACCEPTED: 'bg-success/10 text-success',
      REJECTED: 'bg-error/10 text-error',
      CANCELLED: 'bg-neutral/10 text-neutral',
      REMOVED: 'bg-neutral/10 text-text-secondary',
    } as Record<string, string>)[status] ?? 'bg-neutral/10 text-text-secondary';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  formatTripDate(dateStr: string): { day: string; month: string } {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return { day, month: months[date.getMonth()] };
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
