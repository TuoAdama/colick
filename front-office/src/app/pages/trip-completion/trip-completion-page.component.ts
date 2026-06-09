import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DeliveryCodeCardComponent } from '../../components/trip-completion/delivery-code-card/delivery-code-card.component';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { TripService } from '../../services/trip.service';
import { ReservationAppShellComponent } from '../../shared/components/reservation-app-shell/reservation-app-shell.component';

@Component({
  selector: 'app-trip-completion-page',
  standalone: true,
  imports: [CommonModule, DeliveryCodeCardComponent, ReservationAppShellComponent],
  templateUrl: './trip-completion-page.component.html',
})
export class TripCompletionPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tripService = inject(TripService);

  trip: Trip | null = null;
  bookings: BookingResponse[] = [];
  codeInputs: Partial<Record<number, string>> = {};
  actionError = '';
  actionSuccess = '';
  loadError = '';
  isLoading = true;
  isFinalizing = false;
  private readonly submittingBookingIds = new Set<number>();

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const tripId = Number(params.get('tripId'));

      if (!Number.isInteger(tripId) || tripId <= 0) {
        this.trip = null;
        this.bookings = [];
        this.loadError = 'Impossible de charger cette page de validation.';
        this.isLoading = false;
        return;
      }

      this.loadTripCompletionData(tripId);
    });
  }

  acceptedBookings(): BookingResponse[] {
    return this.bookings.filter((booking) => booking.status === 'ACCEPTED');
  }

  validatedCount(): number {
    return this.acceptedBookings().filter((booking) => !!booking.deliveredAt).length;
  }

  progressPercent(): number {
    const total = this.acceptedBookings().length;
    if (total === 0) {
      return 100;
    }

    return Math.round((this.validatedCount() / total) * 100);
  }

  allCodesValidated(): boolean {
    return this.acceptedBookings().every((booking) => !!booking.deliveredAt);
  }

  isSubmittingBooking(bookingId: number): boolean {
    return this.submittingBookingIds.has(bookingId);
  }

  updateCodeInput(bookingId: number, value: string): void {
    this.codeInputs[bookingId] = value.replace(/\D/g, '').slice(0, 6);
  }

  validateBookingCode(bookingId: number): void {
    if (!this.trip || this.isSubmittingBooking(bookingId)) {
      return;
    }

    const booking = this.bookings.find((currentBooking) => currentBooking.id === bookingId);
    if (!booking || booking.deliveredAt) {
      return;
    }

    const validationCode = this.codeInputs[bookingId]?.trim() ?? '';
    if (!/^\d{6}$/.test(validationCode)) {
      this.actionError = 'Saisissez un code de validation à 6 chiffres.';
      this.actionSuccess = '';
      return;
    }

    this.actionError = '';
    this.actionSuccess = '';
    this.submittingBookingIds.add(bookingId);
    this.tripService.confirmBookingDelivery(this.trip.id, bookingId, { validationCode }).subscribe({
      next: (updatedBooking) => {
        this.bookings = this.bookings.map((currentBooking) =>
          currentBooking.id === updatedBooking.id ? updatedBooking : currentBooking
        );
        this.codeInputs[bookingId] = '';
        this.actionSuccess = 'Code validé avec succès.';
        this.submittingBookingIds.delete(bookingId);
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de valider ce code pour le moment.';
        this.actionSuccess = '';
        this.submittingBookingIds.delete(bookingId);
      },
    });
  }

  finalizeTrip(): void {
    if (!this.trip || this.isFinalizing || !this.allCodesValidated()) {
      return;
    }

    const tripId = this.trip.id;
    this.isFinalizing = true;
    this.actionError = '';
    this.actionSuccess = '';
    this.tripService.completeTrip(tripId).subscribe({
      next: () => {
        this.isFinalizing = false;
        void this.router.navigate(['/trips', tripId, 'reservations']);
      },
      error: (error: { error?: { message?: string } }) => {
        this.actionError = error.error?.message || 'Impossible de finaliser le trajet.';
        this.isFinalizing = false;
      },
    });
  }

  private loadTripCompletionData(tripId: number): void {
    this.isLoading = true;
    this.loadError = '';
    this.actionError = '';
    this.actionSuccess = '';
    this.codeInputs = {};

    forkJoin({
      trip: this.tripService.getTripById(tripId),
      bookings: this.tripService.getTripBookings(tripId),
    }).subscribe({
      next: ({ trip, bookings }) => {
        this.trip = trip;
        this.bookings = bookings;
        this.isLoading = false;
      },
      error: () => {
        this.trip = null;
        this.bookings = [];
        this.loadError = 'Impossible de charger cette page de validation.';
        this.isLoading = false;
      },
    });
  }
}
