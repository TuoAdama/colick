import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { BookingModalComponent } from '../../shared/components/booking-modal/booking-modal.component';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { Location } from '../../models/location.model';
import { Trip } from '../../models/trip.model';
import { BookingResponse } from '../../models/booking.model';
import { UserResponse } from '../../models/auth.model';

/**
 * SearchPageComponent - Page for searching trips by departure and destination.
 * Displays search form with auto-complete inputs and trip result cards.
 * Handles booking modal display and authentication check.
 */
@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AutocompleteComponent, BookingModalComponent],
  templateUrl: './search-page.component.html',
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private readonly tripService = inject(TripService);
  private readonly authService = inject(AuthService);
  private readonly messagingService = inject(MessagingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private queryParamsSubscription?: Subscription;
  private lastAutoSearchKey = '';

  /** Selected departure location */
  departure: Location | null = null;

  /** Selected destination location */
  destination: Location | null = null;

  /** Initial values prefilled from URL query params */
  departureQuery = '';
  destinationQuery = '';

  /** Search results */
  trips: Trip[] = [];

  /** Booking requests already sent by the current user */
  myBookings: BookingResponse[] = [];

  /** Whether a search has been performed */
  hasSearched = false;

  /** Whether a search request is in progress */
  isLoading = false;

  /** Error message if search fails */
  errorMessage = '';

  /** The trip currently selected for booking */
  selectedTrip: Trip | null = null;

  /** Whether the booking modal is open */
  isBookingModalOpen = false;

  /** Success toast message after booking creation */
  bookingSuccessMessage = '';

  /**
   * Handle departure location selection from autocomplete
   */
  onDepartureSelected(location: Location): void {
    this.departure = location;
  }

  /**
   * Handle destination location selection from autocomplete
   */
  onDestinationSelected(location: Location): void {
    this.destination = location;
  }

  /**
   * Check if the search form is valid (both locations selected)
   */
  get isFormValid(): boolean {
    return this.departure !== null && this.destination !== null;
  }

  /**
   * Execute trip search with selected departure and destination
   */
  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadSentBookings();
    }

    this.queryParamsSubscription = this.route.queryParamMap.subscribe((params) => {
      const from = params.get('from')?.trim() ?? '';
      const to = params.get('to')?.trim() ?? '';

      if (!from && !to) {
        return;
      }

      this.departureQuery = from;
      this.destinationQuery = to;

      if (from) {
        this.departure = this.createLocationFromQuery(from);
      }
      if (to) {
        this.destination = this.createLocationFromQuery(to);
      }

      if (!from || !to) {
        return;
      }

      const searchKey = `${from}::${to}`;
      if (searchKey === this.lastAutoSearchKey) {
        return;
      }

      this.lastAutoSearchKey = searchKey;
      this.searchTripsByNames(from, to);
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
  }

  searchTrips(): void {
    if (!this.isFormValid || !this.departure || !this.destination) {
      return;
    }

    this.lastAutoSearchKey = `${this.departure.name}::${this.destination.name}`;
    this.searchTripsByNames(this.departure.name, this.destination.name);
  }

  private searchTripsByNames(departure: string, destination: string): void {
    this.isLoading = true;
    this.hasSearched = true;
    this.errorMessage = '';
    this.trips = [];

    this.tripService
      .searchTrips(departure, destination)
      .subscribe({
        next: (results) => {
          this.trips = results;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage =
            'Une erreur est survenue lors de la recherche. Veuillez réessayer.';
          this.isLoading = false;
        },
      });
  }

  private createLocationFromQuery(name: string): Location {
    return {
      id: 0,
      name,
      country: '',
      type: 'city',
    };
  }

  /**
   * Open the booking modal for a specific trip.
   * Redirects to login if the user is not authenticated.
   */
  openBookingModal(trip: Trip): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.isOwnTrip(trip)) {
      return;
    }
    this.selectedTrip = trip;
    this.isBookingModalOpen = true;
  }

  /**
   * Close the booking modal and reset selected trip.
   */
  closeBookingModal(): void {
    this.isBookingModalOpen = false;
    this.selectedTrip = null;
  }

  /**
   * Handle successful booking creation — show a success toast.
   */
  onBookingCreated(booking: BookingResponse): void {
    this.myBookings = [...this.myBookings, booking];
    this.bookingSuccessMessage = `Demande envoyée avec succès pour "${booking.title}" !`;
    // Auto-close modal and clear message after delay
    setTimeout(() => {
      this.closeBookingModal();
    }, 2000);
    setTimeout(() => {
      this.bookingSuccessMessage = '';
    }, 5000);
  }

  /**
   * Format a date string for display
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Format a time from a date string for display
   */
  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  contactTraveler(trip: Trip): void {
    if (!this.authService.isLoggedIn()) { this.router.navigate(['/login']); return; }
    if (this.isOwnTrip(trip)) {
      return;
    }
    this.messagingService.startConversation({
      tripId: trip.id, recipientId: trip.travelerId,
      content: 'Bonjour, je suis interesse par votre voyage ' + trip.departureAddress + ' vers ' + trip.destination + '.',
    }).subscribe({
      next: () => this.router.navigate(['/messages']),
      error: () => { this.errorMessage = 'Impossible de demarrer la conversation.'; },
    });
  }

  hasActiveBookingForTrip(tripId: number): boolean {
    return this.myBookings.some(
      (booking) => booking.tripId === tripId
        && (booking.status === 'PENDING' || booking.status === 'ACCEPTED')
    );
  }

  private loadSentBookings(): void {
    this.tripService.getMyBookings().subscribe({
      next: (bookings) => {
        this.myBookings = bookings;
      },
      error: () => {
        this.myBookings = [];
      },
    });
  }

  isOwnTrip(trip: Trip): boolean {
    const currentUser: UserResponse | null = this.authService.getUser();
    return !!currentUser && currentUser.id === trip.travelerId;
  }
}
