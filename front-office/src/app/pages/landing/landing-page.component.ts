import { Component, OnDestroy, OnInit, PLATFORM_ID, ElementRef, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, of, timer } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';
import { Location } from '../../models/location.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { TripService } from '../../services/trip.service';
import { CommercialContentService } from '../../services/commercial-content.service';

import { LandingParallaxDirective, LandingRevealDirective } from './landing-motion.directive';
import { LandingVisualComponent } from './landing-visual.component';

type AutocompleteField = 'departure' | 'destination';
type LandingMode = 'send' | 'transport';

interface LandingTripCard {
  id: number;
  travelerId: number;
  reference?: string;
  tag: string;
  price: string;
  departure: string;
  arrival: string;
  date: string;
  traveler: string;
  rating: string;
  capacity: string;
  avatar: string;
  avatarTone: string;
}

/**
 * LandingPageComponent - Assembles all landing page sections.
 * This is the main entry point for the '/' route.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LandingVisualComponent, LandingRevealDirective, LandingParallaxDirective],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private feedSubscription?: Subscription;
  private blurTimer?: ReturnType<typeof setTimeout>;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly locationService = inject(LocationService);
  private readonly tripService = inject(TripService);
  private readonly commercialContent = inject(CommercialContentService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly departureSearchSubject = new Subject<string>();
  private readonly destinationSearchSubject = new Subject<string>();
  private readonly subscriptions = new Subscription();

  departureQuery = '';
  destinationQuery = '';
  travelDate = '';
  departure: Location | null = null;
  destination: Location | null = null;
  departureSuggestions: Location[] = [];
  destinationSuggestions: Location[] = [];
  activeAutocomplete: AutocompleteField | null = null;
  isDepartureLoading = false;
  isDestinationLoading = false;
  isTripsLoading = true;
  tripsError = false;
  formError = '';
  activeSuggestionIndex = -1;
  activeMode: LandingMode = 'send';
  trips: LandingTripCard[] = [];

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isOwnTrip(trip: LandingTripCard): boolean {
    return this.authService.getUser()?.id === trip.travelerId;
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        this.activeMode = params.get('mode') === 'transport' ? 'transport' : 'send';
      })
    );
    this.setupAutocomplete();
    if (isPlatformBrowser(this.platformId)) this.reloadTrips();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.feedSubscription?.unsubscribe();
    if (this.blurTimer) clearTimeout(this.blurTimer);
  }

  searchTrips(): void {
    const from = this.departure?.name ?? this.departureQuery.trim();
    const to = this.destination?.name ?? this.destinationQuery.trim();
    const date = this.travelDate.trim();

    if (!from || !to) {
      this.formError = 'Renseignez votre ville de départ et votre destination.';
      this.element.nativeElement.querySelector<HTMLInputElement>(!from ? '#landing-departure' : '#landing-destination')?.focus();
      return;
    }
    this.formError = '';

    void this.router.navigate(['/search'], {
      queryParams: {
        ...(from && { from }),
        ...(to && { to }),
        ...(date && { date }),
      },
    });
  }

  selectMode(mode: LandingMode): void {
    if (this.activeMode === mode) {
      return;
    }

    this.activeMode = mode;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        mode: mode === 'transport' ? 'transport' : null,
      },
      queryParamsHandling: 'merge',
    });
  }

  searchParcelRequests(): void {
    const from = this.departure?.name ?? this.departureQuery.trim();
    const to = this.destination?.name ?? this.destinationQuery.trim();
    const date = this.travelDate.trim();

    if (!from || !to) {
      this.formError = 'Renseignez votre ville de départ et votre destination.';
      this.element.nativeElement.querySelector<HTMLInputElement>(!from ? '#landing-departure' : '#landing-destination')?.focus();
      return;
    }
    this.formError = '';

    void this.router.navigate(['/parcel-search'], {
      queryParams: {
        ...(from && { from }),
        ...(to && { to }),
        ...(date && { date }),
      },
    });
  }

  publishTrip(): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }
    void this.router.navigate(['/propose']);
  }

  recommendedTripQueryParams(): { returnUrl: string; source: string } {
    return {
      returnUrl: this.router.url,
      source: 'landing_recommended',
    };
  }

  onDepartureInput(): void {
    this.departure = null;
    this.departureSuggestions = [];
    this.isDepartureLoading = this.departureQuery.trim().length >= 2;
    this.activeSuggestionIndex = -1;
    this.formError = '';
    this.activeAutocomplete = 'departure';
    this.departureSearchSubject.next(this.departureQuery.trim());
  }

  onDestinationInput(): void {
    this.destination = null;
    this.destinationSuggestions = [];
    this.isDestinationLoading = this.destinationQuery.trim().length >= 2;
    this.activeSuggestionIndex = -1;
    this.formError = '';
    this.activeAutocomplete = 'destination';
    this.destinationSearchSubject.next(this.destinationQuery.trim());
  }

  showAutocomplete(field: AutocompleteField): void {
    if (this.blurTimer) clearTimeout(this.blurTimer);
    this.activeSuggestionIndex = -1;
    this.activeAutocomplete = field;
  }

  closeAutocompleteSoon(): void {
    this.blurTimer = setTimeout(() => {
      this.activeAutocomplete = null;
    }, 150);
  }

  selectLocation(field: AutocompleteField, location: Location): void {
    const query = `${location.name}, ${location.country}`;
    if (field === 'departure') {
      this.departure = location;
      this.departureQuery = query;
      this.departureSuggestions = [];
    } else {
      this.destination = location;
      this.destinationQuery = query;
      this.destinationSuggestions = [];
    }
    this.activeAutocomplete = null;
    this.activeSuggestionIndex = -1;
    if (field === 'departure') this.isDepartureLoading = false;
    else this.isDestinationLoading = false;
  }

  onAutocompleteKeydown(field: AutocompleteField, event: KeyboardEvent): void {
    const suggestions = field === 'departure' ? this.departureSuggestions : this.destinationSuggestions;
    if (event.key === 'Escape') { this.activeAutocomplete = null; this.activeSuggestionIndex = -1; return; }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
      event.preventDefault();
      this.activeAutocomplete = field;
      this.activeSuggestionIndex = this.activeSuggestionIndex < 0
        ? (event.key === 'ArrowDown' ? 0 : suggestions.length - 1)
        : (this.activeSuggestionIndex + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length;
    } else if (event.key === 'Enter' && this.activeAutocomplete === field && this.activeSuggestionIndex >= 0) {
      event.preventDefault();
      const location = suggestions[this.activeSuggestionIndex];
      if (location) this.selectLocation(field, location);
    }
  }

  swapRoute(): void {
    this.departureSearchSubject.next('');
    this.destinationSearchSubject.next('');
    this.activeSuggestionIndex = -1;
    [this.departureQuery, this.destinationQuery] = [this.destinationQuery, this.departureQuery];
    [this.departure, this.destination] = [this.destination, this.departure];
    this.departureSuggestions = [];
    this.destinationSuggestions = [];
    this.activeAutocomplete = null;
    this.isDepartureLoading = false;
    this.isDestinationLoading = false;
  }

  private setupAutocomplete(): void {
    for (const field of ['departure', 'destination'] as const) {
      const subject = field === 'departure' ? this.departureSearchSubject : this.destinationSearchSubject;
      this.subscriptions.add(subject.pipe(
        // Cancel immediately on each keystroke, including during the debounce window.
        switchMap(query => timer(250).pipe(
          switchMap(() => this.searchLocations(query)),
          map(suggestions => ({ query, suggestions }))
        ))
      ).subscribe(({ query, suggestions }) => {
        const currentQuery = field === 'departure' ? this.departureQuery : this.destinationQuery;
        const selected = field === 'departure' ? this.departure : this.destination;
        if (query !== currentQuery.trim() || selected) return;
        if (field === 'departure') { this.departureSuggestions = suggestions; this.isDepartureLoading = false; }
        else { this.destinationSuggestions = suggestions; this.isDestinationLoading = false; }
      }));
    }
  }

  private searchLocations(query: string) {
    if (query.length < 2) {
      return of([]);
    }
    return this.locationService.searchLocations(query).pipe(
      catchError(() => of([]))
    );
  }

  private deriveCountryFromBrowser(): string | undefined {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryByTimeZone: Record<string, string> = {
      'Europe/Paris': 'France',
      'Europe/Brussels': 'Belgique',
      'Europe/Rome': 'Italie',
      'Europe/Madrid': 'Espagne',
      'Europe/Berlin': 'Allemagne',
      'Africa/Abidjan': "Côte d'Ivoire",
      'Africa/Ouagadougou': 'Burkina Faso',
      'Africa/Bamako': 'Mali',
      'Africa/Conakry': 'Guinee',
      'Africa/Dakar': 'Senegal',
      'Africa/Porto-Novo': 'Benin',
      'Africa/Douala': 'Cameroun',
      'Africa/Casablanca': 'Maroc',
      'Africa/Lome': 'Togo',
      'Africa/Libreville': 'Gabon',
      'Africa/Tunis': 'Tunisie',
      'Africa/Algiers': 'Algerie',
      'Africa/Brazzaville': 'Congo',
    };

    return countryByTimeZone[timeZone];
  }

  reloadTrips(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.feedSubscription?.unsubscribe();
    this.isTripsLoading = true;
    this.tripsError = false;
    this.feedSubscription = this.tripService.getLandingFeed(this.deriveCountryFromBrowser(), 3).pipe(
      timeout(8000)
    ).subscribe({
      next: trips => {
        this.trips = trips.slice(0, 3).map((trip, index) => this.toLandingTripCard(trip, index));
        this.isTripsLoading = false;
      },
      error: () => {
        this.trips = [];
        this.tripsError = true;
        this.isTripsLoading = false;
      },
    });
  }

  private toLandingTripCard(trip: Trip, index: number): LandingTripCard {
    const avatarTones = ['bg-primary', 'bg-accent', 'bg-secondary'];
    return {
      id: trip.id,
      travelerId: trip.travelerId,
      reference: trip.reference,
      tag: trip.instantAcceptance ? 'Flash' : 'Disponible',
      price: this.formatPrice(trip.pricePerKilo),
      departure: trip.departureAddress,
      arrival: trip.destination,
      date: this.formatDate(trip.departureTime),
      traveler: trip.travelerName,
      rating: trip.travelerRatingCount === 0 ? 'Nouveau' : trip.travelerRatingAverage?.toFixed(1) ?? 'Nouveau',
      capacity: `${this.formatWeight(trip.availableWeight)} kg libres`,
      avatar: this.getInitials(trip.travelerName),
      avatarTone: avatarTones[index % avatarTones.length],
    };
  }

  private formatPrice(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2,
    }).format(value) + '€';
  }

  private formatWeight(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 1,
    }).format(value);
  }

  private formatDate(value: string): string {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  get trustCards() {
    return [
      {
        icon: 'verified_user',
        title: 'E-mails vérifiés',
        description: 'Le badge de vérification apparaît uniquement après confirmation de l’adresse e-mail.',
        tone: 'text-accent bg-accent/10',
      },
      {
        icon: 'payments',
        title: this.commercialContent.content().landingTrustTitle,
        description: this.commercialContent.content().landingTrustDescription,
        tone: 'text-accent bg-accent/10',
      },
      {
        icon: 'forum',
        title: 'Support humain',
        description: 'Notre equipe reste disponible pour vous aider a chaque etape.',
        tone: 'text-primary bg-gray-200',
      },
    ];
  }

}
