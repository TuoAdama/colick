import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Location } from '../../models/location.model';
import { ParcelRequest } from '../../models/parcel-request.model';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { MessagingService } from '../../services/messaging.service';
import { ParcelRequestService } from '../../services/parcel-request.service';

type AutocompleteField = 'departure' | 'destination';

@Component({
  selector: 'app-parcel-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parcel-search-page.component.html',
})
export class ParcelSearchPageComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly locationService = inject(LocationService);
  private readonly messagingService = inject(MessagingService);
  private readonly parcelRequestService = inject(ParcelRequestService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly departureSearchSubject = new Subject<string>();
  private readonly destinationSearchSubject = new Subject<string>();
  private readonly subscriptions = new Subscription();

  departureQuery = '';
  destinationQuery = '';
  selectedDate = '';
  departure: Location | null = null;
  destination: Location | null = null;
  departureSuggestions: Location[] = [];
  destinationSuggestions: Location[] = [];
  activeAutocomplete: AutocompleteField | null = null;
  isDepartureLoading = false;
  isDestinationLoading = false;
  hasSearched = false;
  isLoading = false;
  errorMessage = '';
  contactingRequestId: number | null = null;
  requests: ParcelRequest[] = [];

  private lastAutoSearchKey = '';

  ngOnInit(): void {
    this.setupAutocomplete();
    this.subscriptions.add(
      this.route.queryParamMap.subscribe((params) => {
        const from = params.get('from')?.trim() ?? '';
        const to = params.get('to')?.trim() ?? '';
        const date = params.get('date')?.trim() ?? '';

        this.departureQuery = from;
        this.destinationQuery = to;
        this.selectedDate = date;
        this.departure = from ? this.createLocationFromQuery(from) : null;
        this.destination = to ? this.createLocationFromQuery(to) : null;

        if (!from || !to) {
          this.hasSearched = false;
          this.requests = [];
          this.errorMessage = '';
          return;
        }

        if (!this.authService.isLoggedIn()) {
          void this.router.navigate(['/login']);
          return;
        }

        const searchKey = this.buildSearchKey(from, to, date);
        if (searchKey === this.lastAutoSearchKey) {
          return;
        }

        this.lastAutoSearchKey = searchKey;
        this.loadRequests(from, to, date);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  searchRequests(): void {
    const from = this.departure?.name ?? this.departureQuery.trim();
    const to = this.destination?.name ?? this.destinationQuery.trim();
    const date = this.selectedDate.trim();

    if (!from || !to) {
      return;
    }

    if (this.hasMatchingSearchParams(from, to, date)) {
      this.lastAutoSearchKey = this.buildSearchKey(from, to, date);
      if (!this.authService.isLoggedIn()) {
        void this.router.navigate(['/login']);
        return;
      }
      this.loadRequests(from, to, date);
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        from,
        to,
        date: date || null,
      },
    });
  }

  contactSender(request: ParcelRequest): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }
    if (this.contactingRequestId !== null) {
      return;
    }

    this.contactingRequestId = request.id;
    this.errorMessage = '';
    this.messagingService.createConversationDraft({
      parcelRequestId: request.id,
      recipientId: request.senderId,
    }).subscribe({
      next: (conversation) => {
        void this.router.navigate(['/messages'], { queryParams: { conversationId: conversation.id } });
      },
      error: () => {
        this.errorMessage = 'Impossible de demarrer la conversation.';
        this.contactingRequestId = null;
      },
    });
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

  dateLabel(date?: string): string {
    if (!date) {
      return 'Date flexible';
    }

    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  resultRouteLabel(): string | null {
    if (!this.departureQuery || !this.destinationQuery) {
      return null;
    }
    return `${this.departureQuery} → ${this.destinationQuery}`;
  }

  requestInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  formatWeight(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 1,
    }).format(value);
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

  private hasMatchingSearchParams(from: string, to: string, date: string): boolean {
    const currentParams = this.route.snapshot.queryParamMap;
    return currentParams.get('from')?.trim() === from
      && currentParams.get('to')?.trim() === to
      && (currentParams.get('date')?.trim() ?? '') === date;
  }

  private loadRequests(from: string, to: string, date: string): void {
    this.hasSearched = true;
    this.isLoading = true;
    this.errorMessage = '';
    this.requests = [];

    this.parcelRequestService.getAvailableRequests({
      departure: from,
      destination: to,
      date,
    }).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les demandes de colis.';
        this.isLoading = false;
      },
    });
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

  private buildSearchKey(from: string, to: string, date: string): string {
    return JSON.stringify({ from, to, date });
  }
}
