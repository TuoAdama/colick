import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { TripService } from '../../services/trip.service';
import { Location } from '../../models/location.model';
import { CreateTripDto } from '../../models/trip.model';

/**
 * ProposeTripPageComponent - Page form allowing a traveler to propose a new trip.
 * Collects departure, destination, dates, weight, price and acceptance mode,
 * then POSTs to /api/trips and redirects to /search on success.
 */
@Component({
  selector: 'app-propose-trip-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AutocompleteComponent],
  templateUrl: './propose-trip-page.component.html',
})
export class ProposeTripPageComponent {
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);

  // --- Form fields ---

  /** Selected departure location */
  departure: Location | null = null;

  /** Selected destination location */
  destination: Location | null = null;

  /** Departure datetime (ISO string from datetime-local input) */
  departureTime = '';

  /** Estimated arrival datetime (ISO string from datetime-local input) */
  arrivalTime = '';

  /** Maximum weight accepted in kg */
  maxWeight: number | null = null;

  /** Price per kilo in euros */
  pricePerKilo: number | null = null;

  /** Whether the traveler accepts bookings instantly */
  instantAcceptance = false;

  /** Minimum selectable datetime (now, in local time, formatted for datetime-local input). */
  get minDateTime(): string {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  // --- UI state ---

  /** Whether the form submission is in progress */
  isLoading = false;

  /** Error message to display on failure */
  errorMessage = '';

  /** Whether all required fields are filled */
  get isFormValid(): boolean {
    return (
      this.departure !== null &&
      this.destination !== null &&
      this.departureTime !== '' &&
      this.arrivalTime !== '' &&
      this.maxWeight !== null &&
      this.maxWeight >= 1 &&
      this.pricePerKilo !== null &&
      this.pricePerKilo >= 0
    );
  }

  onDepartureSelected(location: Location): void {
    this.departure = location;
  }

  onDestinationSelected(location: Location): void {
    this.destination = location;
  }

  onDepartureCleared(): void {
    this.departure = null;
  }

  onDestinationCleared(): void {
    this.destination = null;
  }

  /**
   * Submit the trip form.
   * Validates fields, calls TripService.createTrip(), then navigates to /search.
   */
  submit(): void {
    if (!this.isFormValid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: CreateTripDto = {
      departureAddress: `${this.departure!.name}, ${this.departure!.country}`,
      destination: `${this.destination!.name}, ${this.destination!.country}`,
      departureTime: this.departureTime,
      arrivalTime: this.arrivalTime,
      maxWeight: this.maxWeight!,
      pricePerKilo: this.pricePerKilo!,
      instantAcceptance: this.instantAcceptance,
    };

    this.tripService.createTrip(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/search']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage =
          'Une erreur est survenue lors de la publication du voyage. Veuillez réessayer.';
      },
    });
  }
}
