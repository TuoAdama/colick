import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SentBookingResponse } from '../../models/booking.model';
import { TripService } from '../../services/trip.service';
import { routeCity, sentBookingStatusLabel } from '../../shared/utils/sent-booking-presentation';

@Component({
  selector: 'app-sent-bookings-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sent-bookings-page.component.html',
  styleUrls: ['./sent-booking-layout.css', './sent-bookings-page.component.css'],
})
export class SentBookingsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);

  readonly routeCity = routeCity;
  readonly statusLabel = sentBookingStatusLabel;
  myBookings: SentBookingResponse[] = [];
  isLoadingBookings = false;
  actionError = '';

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
        const timestamp = (value?: string) => Date.parse(value ?? '') || 0;
        this.myBookings = [...bookings].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
        this.isLoadingBookings = false;
      },
      error: () => {
        this.actionError = 'Impossible de charger vos demandes envoyées pour le moment.';
        this.isLoadingBookings = false;
      },
    });
  }
}
