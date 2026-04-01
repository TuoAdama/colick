import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { BookingModalComponent } from '../../shared/components/booking-modal/booking-modal.component';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { Location } from '../../models/location.model';
import { Trip } from '../../models/trip.model';
import { BookingResponse } from '../../models/booking.model';

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
export class SearchPageComponent {
  private readonly tripService = inject(TripService);
  private readonly authService = inject(AuthService);
  private readonly messagingService = inject(MessagingService);
  private readonly router = inject(Router);

  /** Selected departure location */
  departure: Location | null = null;

  /** Selected destination location */
  destination: Location | null = null;

  /** Search results */
  trips: Trip[] = [];

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
  searchTrips(): void {
    if (!this.isFormValid || !this.departure || !this.destination) {
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    this.errorMessage = '';
    this.trips = [];

    this.tripService
      .searchTrips(this.departure.name, this.destination.name)
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

  /**
   * Open the booking modal for a specific trip.
   * Redirects to login if the user is not authenticated.
   */
  openBookingModal(trip: Trip): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
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
    this.messagingService.startConversation({
      tripId: trip.id, recipientId: trip.travelerId,
      content: 'Bonjour, je suis interesse par votre voyage ' + trip.departureAddress + ' vers ' + trip.destination + '.',
    }).subscribe({
      next: () => this.router.navigate(['/messages']),
      error: () => { this.errorMessage = 'Impossible de demarrer la conversation.'; },
    });
  }
}
