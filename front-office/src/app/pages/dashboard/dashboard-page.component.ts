import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { Trip } from '../../models/trip.model';
import { BookingResponse } from '../../models/booking.model';
import { UpdateProfileRequest } from '../../models/auth.model';

/** Discriminated union of available dashboard tabs. */
type Tab = 'profile' | 'chats' | 'received' | 'sent';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  activeTab: Tab = 'profile';

  /** Tab definitions with labels and inline SVG icons. */
  tabs = [
    {
      id: 'profile' as Tab,
      label: 'Mon profil',
      icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>',
    },
    {
      id: 'chats' as Tab,
      label: 'Mes chats',
      icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
    },
    {
      id: 'received' as Tab,
      label: 'Réservations reçues',
      icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>',
    },
    {
      id: 'sent' as Tab,
      label: 'Mes demandes',
      icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
    },
  ];

  // ── Profile form ──────────────────────────────────────────────────────────
  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: [''],
  });
  profileSuccess = '';
  profileError = '';
  isSavingProfile = false;

  // ── Received reservations (my trips + their bookings) ─────────────────────
  myTrips: Trip[] = [];
  /** Cache: tripId → its bookings (loaded in parallel with the trips). */
  tripBookingsMap: Record<number, BookingResponse[]> = {};
  selectedTripBookings: BookingResponse[] = [];
  selectedTripId: number | null = null;
  isLoadingTrips = false;
  isLoadingBookings = false;
  bookingActionError = '';

  // ── Sent requests ─────────────────────────────────────────────────────────
  myBookings: BookingResponse[] = [];
  isLoadingSentBookings = false;

  /** Observable stream of the currently authenticated user. */
  currentUser$ = this.authService.currentUser$;

  ngOnInit(): void {
    // Redirect unauthenticated users to the login page.
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Pre-fill the profile form with the stored user data.
    const user = this.authService.getUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? '',
      });
    }
  }

  /** Switch to a given tab and lazily load its data on first visit. */
  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'received' && this.myTrips.length === 0) {
      this.loadMyTrips();
    }
    if (tab === 'sent' && this.myBookings.length === 0) {
      this.loadSentBookings();
    }
  }

  /** Submit the profile form and persist changes via the API. */
  saveProfile(): void {
    if (this.profileForm.invalid || this.isSavingProfile) return;
    const user = this.authService.getUser();
    if (!user) return;

    this.isSavingProfile = true;
    this.profileSuccess = '';
    this.profileError = '';

    const val = this.profileForm.value;
    const payload: UpdateProfileRequest = {
      firstName: val.firstName ?? undefined,
      lastName: val.lastName ?? undefined,
      email: val.email ?? undefined,
      phone: val.phone || undefined,
    };
    if (val.password) payload.password = val.password;

    this.authService.updateProfile(user.id, payload).subscribe({
      next: () => {
        this.profileSuccess = 'Profil mis à jour avec succès.';
        this.profileForm.patchValue({ password: '' });
        this.isSavingProfile = false;
      },
      error: () => {
        this.profileError = 'Erreur lors de la mise à jour du profil.';
        this.isSavingProfile = false;
      },
    });
  }

  /** Load the trips published by the current user, then fetch bookings for all in parallel. */
  loadMyTrips(): void {
    this.isLoadingTrips = true;
    this.tripService.getMyTrips().subscribe({
      next: (trips) => {
        this.myTrips = trips;
        if (trips.length === 0) {
          this.isLoadingTrips = false;
          return;
        }
        // Load bookings for every trip in parallel and cache them.
        const bookingRequests = trips.map((t) =>
          this.tripService.getTripBookings(t.id).pipe(catchError(() => of([])))
        );
        forkJoin(bookingRequests).subscribe((results) => {
          trips.forEach((t, i) => {
            this.tripBookingsMap[t.id] = results[i] as BookingResponse[];
          });
          this.isLoadingTrips = false;
        });
      },
      error: () => {
        this.isLoadingTrips = false;
      },
    });
  }

  /** Select a trip and display its cached bookings (no extra HTTP call). */
  selectTrip(tripId: number): void {
    this.selectedTripId = tripId;
    this.bookingActionError = '';
    this.selectedTripBookings = this.tripBookingsMap[tripId] ?? [];
  }

  /** Accept a pending booking and update the local list and cache. */
  acceptBooking(bookingId: number): void {
    if (!this.selectedTripId) return;
    this.bookingActionError = '';
    this.tripService.acceptBooking(this.selectedTripId, bookingId).subscribe({
      next: (updated) => {
        const idx = this.selectedTripBookings.findIndex((x) => x.id === updated.id);
        if (idx >= 0) {
          this.selectedTripBookings[idx] = updated;
          this.tripBookingsMap[this.selectedTripId!][idx] = updated;
        }
      },
      error: () => {
        this.bookingActionError = "Erreur lors de l'acceptation de la demande.";
      },
    });
  }

  /** Reject a pending booking and update the local list and cache. */
  rejectBooking(bookingId: number): void {
    if (!this.selectedTripId) return;
    this.bookingActionError = '';
    this.tripService.rejectBooking(this.selectedTripId, bookingId).subscribe({
      next: (updated) => {
        const idx = this.selectedTripBookings.findIndex((x) => x.id === updated.id);
        if (idx >= 0) {
          this.selectedTripBookings[idx] = updated;
          this.tripBookingsMap[this.selectedTripId!][idx] = updated;
        }
      },
      error: () => {
        this.bookingActionError = 'Erreur lors du refus de la demande.';
      },
    });
  }

  /** Load the booking requests sent by the current user. */
  loadSentBookings(): void {
    this.isLoadingSentBookings = true;
    this.tripService.getMyBookings().subscribe({
      next: (bookings) => {
        this.myBookings = bookings;
        this.isLoadingSentBookings = false;
      },
      error: () => {
        this.isLoadingSentBookings = false;
      },
    });
  }

  /** Return a human-readable label for a booking status. */
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Refusée',
    };
    return map[status] ?? status;
  }

  /** Return Tailwind badge classes for a booking status. */
  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return map[status] ?? 'bg-gray-100 text-gray-800';
  }
}
