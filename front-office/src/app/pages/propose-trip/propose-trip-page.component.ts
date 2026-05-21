import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { TripService } from '../../services/trip.service';
import { Location } from '../../models/location.model';
import { CreateTripDto, Trip } from '../../models/trip.model';
import { extractApiErrorMessage } from '../../shared/utils/api-error.utils';

/**
 * ProposeTripPageComponent - Shared form used to create or edit a trip.
 * Collects departure, destination, dates, weight, price and acceptance mode,
 * then creates or updates the trip depending on the current route.
 */
@Component({
  selector: 'app-propose-trip-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AutocompleteComponent],
  templateUrl: './propose-trip-page.component.html',
})
export class ProposeTripPageComponent implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Trip identifier when editing an existing trip. */
  tripId: number | null = null;

  /** Whether the page is currently used to edit an existing trip. */
  isEditMode = false;

  // --- Form fields ---

  /** Selected departure location */
  departure: Location | null = null;

  /** Selected destination location */
  destination: Location | null = null;

  /** Departure datetime (ISO string from datetime-local input) */
  departureTime = '';

  /** Estimated arrival datetime (ISO string from datetime-local input) */
  arrivalTime = '';

  /** Initial query displayed in the departure autocomplete. */
  departureQuery = '';

  /** Initial query displayed in the destination autocomplete. */
  destinationQuery = '';

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

  /** Whether the trip details are loading in edit mode */
  isPageLoading = false;

  /** Error message to display on failure */
  errorMessage = '';

  /** Status of the loaded trip when editing. */
  loadedTripStatus: Trip['status'] | null = null;

  ngOnInit(): void {
    const tripIdParam = this.route.snapshot.paramMap.get('id');
    if (!tripIdParam) {
      return;
    }

    const parsedTripId = Number(tripIdParam);
    if (Number.isNaN(parsedTripId)) {
      this.isEditMode = true;
      this.errorMessage = 'Voyage introuvable.';
      return;
    }

    this.isEditMode = true;
    this.tripId = parsedTripId;
    this.loadTrip(parsedTripId);
  }

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

  /** Whether the current trip can be edited according to business rules. */
  get canEditTrip(): boolean {
    return !this.isEditMode || this.loadedTripStatus === 'ACTIVE';
  }

  /** Whether the submit action should be disabled. */
  get isSubmitDisabled(): boolean {
    return this.isPageLoading || this.isLoading || !this.isFormValid || !this.canEditTrip;
  }

  /** Dynamic page title according to mode. */
  get pageTitle(): string {
    return this.isEditMode ? 'Modifier un voyage' : 'Proposer un voyage';
  }

  /** Dynamic introductory text according to mode. */
  get pageDescription(): string {
    return this.isEditMode
      ? 'Mettez à jour votre itinéraire et vos conditions de transport.'
      : 'Partagez votre itinéraire et transportez des colis contre rémunération.';
  }

  /** Dynamic submit button text according to mode. */
  get submitButtonLabel(): string {
    return this.isEditMode ? 'Enregistrer les modifications' : 'Publier le voyage';
  }

  /** Dynamic loading text according to mode. */
  get submitLoadingLabel(): string {
    return this.isEditMode ? 'Mise à jour en cours…' : 'Publication en cours…';
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
   * Validates fields, then creates or updates the trip depending on the current mode.
   */
  submit(): void {
    if (!this.canEditTrip) {
      this.errorMessage = 'Seuls les voyages actifs peuvent être modifiés.';
      return;
    }

    if (!this.isFormValid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: CreateTripDto = {
      departureAddress: this.formatLocation(this.departure!),
      destination: this.formatLocation(this.destination!),
      departureTime: this.departureTime,
      arrivalTime: this.arrivalTime,
      maxWeight: this.maxWeight!,
      pricePerKilo: this.pricePerKilo!,
      instantAcceptance: this.instantAcceptance,
    };

    const request$ = this.isEditMode && this.tripId !== null
      ? this.tripService.updateTrip(this.tripId, payload)
      : this.tripService.createTrip(payload);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        if (this.isEditMode) {
          this.router.navigate(['/dashboard'], { queryParams: { tab: 'received' } });
          return;
        }
        this.router.navigate(['/search']);
      },
      error: (err: unknown) => {
        this.isLoading = false;
        const fallback = this.isEditMode
          ? 'Une erreur est survenue lors de la mise à jour du voyage. Veuillez réessayer.'
          : 'Une erreur est survenue lors de la publication du voyage. Veuillez réessayer.';
        this.errorMessage = extractApiErrorMessage(err, fallback);
      },
    });
  }

  private loadTrip(tripId: number): void {
    this.isPageLoading = true;
    this.errorMessage = '';

    this.tripService.getTripById(tripId).subscribe({
      next: (trip) => {
        this.loadedTripStatus = trip.status;
        this.populateForm(trip);
        if (trip.status !== 'ACTIVE') {
          this.errorMessage = 'Seuls les voyages actifs peuvent être modifiés.';
        }
        this.isPageLoading = false;
      },
      error: (err: unknown) => {
        this.errorMessage = extractApiErrorMessage(
          err,
          'Une erreur est survenue lors du chargement du voyage. Veuillez réessayer.',
        );
        this.isPageLoading = false;
      },
    });
  }

  private populateForm(trip: Trip): void {
    this.departureQuery = trip.departureAddress;
    this.destinationQuery = trip.destination;
    this.departure = this.createLocationFromAddress(trip.departureAddress);
    this.destination = this.createLocationFromAddress(trip.destination);
    this.departureTime = this.toDateTimeLocalValue(trip.departureTime);
    this.arrivalTime = this.toDateTimeLocalValue(trip.arrivalTime);
    this.maxWeight = trip.maxWeight;
    this.pricePerKilo = trip.pricePerKilo;
    this.instantAcceptance = trip.instantAcceptance;
  }

  private createLocationFromAddress(address: string): Location {
    const parts = address
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    return {
      id: 0,
      name: parts[0] ?? address,
      country: parts.slice(1).join(', '),
      isoCode: '',
      type: 'CITY',
    };
  }

  private formatLocation(location: Location): string {
    return location.country ? `${location.name}, ${location.country}` : location.name;
  }

  private toDateTimeLocalValue(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.slice(0, 16);
    }
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }
}
