import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { TripService } from '../../services/trip.service';
import { Location } from '../../models/location.model';
import { Trip } from '../../models/trip.model';

/**
 * SearchPageComponent - Page for searching trips by departure and destination.
 * Displays search form with auto-complete inputs and trip result cards.
 */
@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, AutocompleteComponent],
  templateUrl: './search-page.component.html',
})
export class SearchPageComponent {
  private readonly tripService = inject(TripService);

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
}
