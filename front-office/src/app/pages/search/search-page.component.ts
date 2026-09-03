import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { BookingModalComponent } from '../../shared/components/booking-modal/booking-modal.component';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { TripSearchCriteria, TripSearchSort, TripService } from '../../services/trip.service';
import { TripAlertService } from '../../services/trip-alert.service';
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
  imports: [CommonModule, FormsModule, RouterLink, AutocompleteComponent, BookingModalComponent, UserAvatarComponent],
  templateUrl: './search-page.component.html',
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  @ViewChild('filterPanel') filterPanel?: ElementRef<HTMLElement>;
  isMobileSearchEditing = false;
  draftSort: TripSearchSort = 'price_asc';
  draftMinPrice: number | null = null;
  draftMaxPrice: number | null = null;
  private filterOpener: HTMLElement | null = null;
  private previousOverflow = '';
  private focusTimer?: ReturnType<typeof setTimeout>;

  get activeFilterCount(): number {
    return Number(this.minPrice !== null) + Number(this.maxPrice !== null);
  }

  private readonly tripService = inject(TripService);
  private readonly tripAlertService = inject(TripAlertService);
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
  selectedDate = '';
  sort: TripSearchSort = 'price_asc';
  minPrice: number | null = null;
  maxPrice: number | null = null;

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

  /** Alert creation state for no-result searches */
  isCreatingAlert = false;
  alertSuccessMessage = '';
  alertErrorMessage = '';

  /** Whether the mobile filters accordion is open */
  areMobileFiltersOpen = false;

  readonly sortOptions: Array<{ value: TripSearchSort; label: string }> = [
    { value: 'price_asc', label: 'Prix le plus bas' },
    { value: 'departure_asc', label: 'Date de départ (Proche)' },
    { value: 'rating_desc', label: 'Meilleurs avis' },
  ];

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
      const date = params.get('date')?.trim() ?? '';
      const sort = this.parseSort(params.get('sort'));
      const minPrice = this.parseOptionalNumber(params.get('minPrice'));
      const maxPrice = this.parseOptionalNumber(params.get('maxPrice'));

      if (!from && !to) {
        return;
      }

      this.departureQuery = from;
      this.destinationQuery = to;
      this.selectedDate = date;
      this.sort = sort;
      this.minPrice = minPrice;
      this.maxPrice = maxPrice;

      if (from) {
        this.departure = this.createLocationFromQuery(from);
      }
      if (to) {
        this.destination = this.createLocationFromQuery(to);
      }

      if (!from || !to) {
        return;
      }

      const criteria = this.buildCriteria(from, to, date, sort, minPrice, maxPrice);
      const searchKey = this.buildSearchKey(criteria);
      if (searchKey === this.lastAutoSearchKey) {
        return;
      }

      this.lastAutoSearchKey = searchKey;
      this.searchTripsByCriteria(criteria);
    });
  }

  ngOnDestroy(): void {
    this.queryParamsSubscription?.unsubscribe();
    this.closeMobileFilters();
  }

  searchTrips(): void {
    if (!this.isFormValid || !this.departure || !this.destination) {
      return;
    }

    this.isMobileSearchEditing = false;
    const from = this.departure.name;
    const to = this.destination.name;
    const criteria = this.buildCriteria(
      from,
      to,
      this.selectedDate,
      this.sort,
      this.minPrice,
      this.maxPrice
    );

    if (this.hasMatchingSearchParams(criteria)) {
      this.lastAutoSearchKey = this.buildSearchKey(criteria);
      this.searchTripsByCriteria(criteria);
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.toQueryParams(criteria),
    });
  }

  onFilterChange(): void {
    if (this.isFormValid) {
      this.searchTrips();
    }
  }

  toggleMobileFilters(): void {
    if (this.areMobileFiltersOpen) {
      this.closeMobileFilters();
      return;
    }
    this.draftSort = this.sort;
    this.draftMinPrice = this.minPrice;
    this.draftMaxPrice = this.maxPrice;
    this.filterOpener = this.document.activeElement as HTMLElement | null;
    this.previousOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.areMobileFiltersOpen = true;
    this.focusTimer = setTimeout(() => this.filterPanel?.nativeElement.querySelector<HTMLElement>('button')?.focus());
  }

  closeMobileFilters(): void {
    clearTimeout(this.focusTimer);
    if (!this.areMobileFiltersOpen) return;
    this.areMobileFiltersOpen = false;
    this.document.body.style.overflow = this.previousOverflow;
    this.filterOpener?.focus();
  }

  applyMobileFilters(): void {
    this.sort = this.draftSort;
    this.minPrice = this.draftMinPrice;
    this.maxPrice = this.draftMaxPrice;
    this.closeMobileFilters();
    this.onFilterChange();
  }

  removePriceFilter(bound: 'minPrice' | 'maxPrice'): void {
    this[bound] = null;
    this.onFilterChange();
  }

  @HostListener('document:keydown', ['$event'])
  onFilterKeydown(event: KeyboardEvent): void {
    if (!this.areMobileFiltersOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMobileFilters();
    }
    if (event.key !== 'Tab') return;
    const controls = this.filterPanel?.nativeElement.querySelectorAll<HTMLElement>('button, input, select');
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    if ((this.document.defaultView?.innerWidth ?? 0) >= 768) this.closeMobileFilters();
  }

  formatPrice(price: number): string {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  arrivesAnotherDay(trip: Trip): boolean {
    return new Date(trip.departureTime).toDateString() !== new Date(trip.arrivalTime).toDateString();
  }

  private searchTripsByCriteria(criteria: TripSearchCriteria): void {
    this.isLoading = true;
    this.hasSearched = true;
    this.errorMessage = '';
    this.trips = [];

    this.tripService
      .searchTrips(criteria)
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

  private hasMatchingSearchParams(criteria: TripSearchCriteria): boolean {
    const currentParams = this.route.snapshot.queryParamMap;
    return currentParams.get('from')?.trim() === criteria.departure
      && currentParams.get('to')?.trim() === criteria.destination
      && (currentParams.get('date')?.trim() ?? '') === (criteria.date ?? '')
      && (this.parseSort(currentParams.get('sort'))) === criteria.sort
      && this.parseOptionalNumber(currentParams.get('minPrice')) === (criteria.minPrice ?? null)
      && this.parseOptionalNumber(currentParams.get('maxPrice')) === (criteria.maxPrice ?? null);
  }

  private buildCriteria(
    departure: string,
    destination: string,
    date: string,
    sort: TripSearchSort,
    minPrice: number | null,
    maxPrice: number | null,
  ): TripSearchCriteria {
    return {
      departure,
      destination,
      date: date || undefined,
      sort,
      minPrice,
      maxPrice,
    };
  }

  private toQueryParams(criteria: TripSearchCriteria): Record<string, string | number | null> {
    return {
      from: criteria.departure ?? null,
      to: criteria.destination ?? null,
      date: criteria.date ?? null,
      sort: criteria.sort ?? null,
      minPrice: criteria.minPrice ?? null,
      maxPrice: criteria.maxPrice ?? null,
    };
  }

  private buildSearchKey(criteria: TripSearchCriteria): string {
    return JSON.stringify({
      departure: criteria.departure ?? '',
      destination: criteria.destination ?? '',
      date: criteria.date ?? '',
      sort: criteria.sort ?? '',
      minPrice: criteria.minPrice ?? null,
      maxPrice: criteria.maxPrice ?? null,
    });
  }

  private parseSort(value: string | null): TripSearchSort {
    return value === 'departure_asc' || value === 'rating_desc' || value === 'price_asc'
      ? value
      : 'price_asc';
  }

  private parseOptionalNumber(value: string | null): number | null {
    if (value === null || value.trim() === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private createLocationFromQuery(name: string): Location {
    return {
      id: 0,
      name,
      country: '',
      isoCode: '',
      type: 'CITY',
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
    this.messagingService.createConversationDraft({
      tripId: trip.id, recipientId: trip.travelerId,
    }).subscribe({
      next: (conversation) => this.router.navigate(['/messages'], { queryParams: { conversationId: conversation.id } }),
      error: () => { this.errorMessage = 'Impossible de demarrer la conversation.'; },
    });
  }

  createAlertForCurrentSearch(): void {
    if (!this.departure?.name || !this.destination?.name || this.isCreatingAlert) {
      return;
    }
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }

    const criteria = this.buildCriteria(
      this.departure.name,
      this.destination.name,
      this.selectedDate,
      this.sort,
      this.minPrice,
      this.maxPrice
    );

    this.isCreatingAlert = true;
    this.alertSuccessMessage = '';
    this.alertErrorMessage = '';

    this.tripAlertService.createAlert({
      departure: criteria.departure ?? '',
      destination: criteria.destination ?? '',
      date: criteria.date,
      sort: criteria.sort,
      minPrice: criteria.minPrice,
      maxPrice: criteria.maxPrice,
    }).subscribe({
      next: (alert) => {
        this.alertSuccessMessage = alert.alreadyExists
          ? 'Cette alerte est deja active dans votre espace.'
          : "Alerte activee. Vous serez informe des qu'un trajet correspondant sera disponible.";
        this.isCreatingAlert = false;
      },
      error: () => {
        this.alertErrorMessage = "Impossible de creer l'alerte pour le moment.";
        this.isCreatingAlert = false;
      },
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

  hasTravelerRating(trip: Trip): boolean {
    return trip.travelerRatingAverage !== null
      && trip.travelerRatingAverage !== undefined
      && (trip.travelerRatingCount ?? 0) > 0;
  }

  formatTravelerRatingAverage(trip: Trip): string {
    return (trip.travelerRatingAverage ?? 0).toFixed(1);
  }

  resultRouteLabel(): string {
    if (!this.departure?.name || !this.destination?.name) {
      return '';
    }
    return `${this.departure.name} -> ${this.destination.name}`;
  }

  parcelRequestQueryParams(): Record<string, string | null> {
    return {
      from: this.departure?.name ?? null,
      to: this.destination?.name ?? null,
      date: this.selectedDate || null,
    };
  }
}
