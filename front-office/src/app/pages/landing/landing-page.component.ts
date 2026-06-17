import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Location } from '../../models/location.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { TripService } from '../../services/trip.service';

type AutocompleteField = 'departure' | 'destination';
type LandingMode = 'send' | 'transport';

interface LandingTripCard {
  id: number;
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
  imports: [FormsModule, RouterLink],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly locationService = inject(LocationService);
  private readonly tripService = inject(TripService);
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
  activeMode: LandingMode = 'send';
  trips: LandingTripCard[] = [];

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        this.activeMode = params.get('mode') === 'transport' ? 'transport' : 'send';
      })
    );
    this.setupAutocomplete();
    this.loadTripsFromApproximatePosition();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  searchTrips(): void {
    const from = this.departure?.name ?? this.departureQuery.trim();
    const to = this.destination?.name ?? this.destinationQuery.trim();
    const date = this.travelDate.trim();

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

  onDepartureInput(): void {
    this.departure = null;
    this.activeAutocomplete = 'departure';
    this.departureSearchSubject.next(this.departureQuery.trim());
  }

  onDestinationInput(): void {
    this.destination = null;
    this.activeAutocomplete = 'destination';
    this.destinationSearchSubject.next(this.destinationQuery.trim());
  }

  showAutocomplete(field: AutocompleteField): void {
    this.activeAutocomplete = field;
  }

  closeAutocompleteSoon(): void {
    setTimeout(() => {
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
  }

  private setupAutocomplete(): void {
    this.subscriptions.add(
      this.departureSearchSubject.pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => {
          this.isDepartureLoading = this.departureQuery.trim().length >= 2;
        }),
        switchMap((query) => this.searchLocations(query))
      ).subscribe((suggestions) => {
        this.departureSuggestions = suggestions;
        this.isDepartureLoading = false;
      })
    );

    this.subscriptions.add(
      this.destinationSearchSubject.pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => {
          this.isDestinationLoading = this.destinationQuery.trim().length >= 2;
        }),
        switchMap((query) => this.searchLocations(query))
      ).subscribe((suggestions) => {
        this.destinationSuggestions = suggestions;
        this.isDestinationLoading = false;
      })
    );
  }

  private searchLocations(query: string) {
    if (query.length < 2) {
      return of([]);
    }
    return this.locationService.searchLocations(query).pipe(
      catchError(() => of([]))
    );
  }

  private loadTripsFromApproximatePosition(): void {
    if (!('geolocation' in navigator)) {
      this.loadLandingTrips();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => this.loadLandingTrips(this.deriveCountryFromBrowser()),
      () => this.loadLandingTrips(),
      { enableHighAccuracy: false, timeout: 2000, maximumAge: 300000 }
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

  private loadLandingTrips(country?: string): void {
    this.isTripsLoading = true;
    this.tripService.getLandingFeed(country, 3).subscribe({
      next: (trips) => {
        this.trips = trips.map((trip, index) => this.toLandingTripCard(trip, index));
        this.isTripsLoading = false;
      },
      error: () => {
        this.trips = [];
        this.isTripsLoading = false;
      },
    });
  }

  private toLandingTripCard(trip: Trip, index: number): LandingTripCard {
    const avatarTones = ['bg-primary', 'bg-accent', 'bg-secondary'];
    return {
      id: trip.id,
      tag: trip.instantAcceptance ? 'Flash' : 'Disponible',
      price: this.formatPrice(trip.pricePerKilo),
      departure: trip.departureAddress,
      arrival: trip.destination,
      date: this.formatDate(trip.departureTime),
      traveler: trip.travelerName,
      rating: trip.travelerRatingAverage?.toFixed(1) ?? 'Nouveau',
      capacity: `${this.formatWeight(trip.availableWeight)}kg libres`,
      avatar: this.getInitials(trip.travelerName),
      avatarTone: avatarTones[index % avatarTones.length],
    };
  }

  private formatPrice(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0,
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

  readonly stats = [
    {
      icon: 'travel_explore',
      value: '30 000+',
      label: 'recherches effectuees ce mois',
      tone: 'text-accent bg-accent/10',
    },
    {
      icon: 'inventory_2',
      value: '5 000+',
      label: 'colis deja livres en Afrique et en Europe',
      tone: 'text-accent bg-accent/10',
    },
    {
      icon: 'add_circle',
      value: '3 clics',
      label: 'pour publier votre trajet',
      tone: 'text-primary bg-gray-200',
    },
  ];

  readonly trustCards = [
    {
      icon: 'verified_user',
      title: 'Profils verifies',
      description: 'Chaque membre est authentifie pour creer un cadre fiable.',
      tone: 'text-accent bg-accent/10',
    },
    {
      icon: 'payments',
      title: 'Zero stress',
      description: 'Le paiement reste securise jusqu a confirmation de livraison.',
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
