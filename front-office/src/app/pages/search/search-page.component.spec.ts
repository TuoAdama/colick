import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { SearchPageComponent } from './search-page.component';
import { TripService } from '../../services/trip.service';
import { TripAlertService } from '../../services/trip-alert.service';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { LocationService } from '../../services/location.service';
import { SearchHistoryService } from '../../services/search-history.service';
import { SearchHistoryEntry } from '../../models/search-history.model';
import { Trip } from '../../models/trip.model';

describe('SearchPageComponent', () => {
  let fixture: ComponentFixture<SearchPageComponent>;
  let component: SearchPageComponent;
  let router: Router;
  let activatedRoute: ActivatedRoute;
  let queryParamMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let routeMock: {
    queryParamMap: Observable<ReturnType<typeof convertToParamMap>>;
    snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> };
  };

  const tripServiceMock = {
    searchTrips: jasmine.createSpy('searchTrips').and.returnValue(of([])),
    createBooking: jasmine.createSpy('createBooking'),
    getMyBookings: jasmine.createSpy('getMyBookings').and.returnValue(of([])),
  };

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
    getUser: jasmine.createSpy('getUser').and.returnValue(null),
  };

  const messagingServiceMock = {
    startConversation: jasmine.createSpy('startConversation').and.returnValue(of(null)),
    createConversationDraft: jasmine.createSpy('createConversationDraft').and.returnValue(of({ id: 1 })),
  };

  const tripAlertServiceMock = {
    createAlert: jasmine.createSpy('createAlert').and.returnValue(of({ id: 1 })),
  };

  const locationServiceMock = {
    searchLocations: jasmine.createSpy('searchLocations').and.returnValue(of([])),
  };

  const searchHistoryServiceMock = {
    getEntries: jasmine.createSpy('getEntries').and.returnValue([] as SearchHistoryEntry[]),
    add: jasmine.createSpy('add').and.callFake((criteria) => [{ criteria, createdAt: '2026-09-21T00:00:00.000Z' }]),
    clear: jasmine.createSpy('clear'),
  };

  beforeEach(async () => {
    queryParamMapSubject = new BehaviorSubject(convertToParamMap({}));
    routeMock = {
      queryParamMap: queryParamMapSubject.asObservable(),
      snapshot: { queryParamMap: convertToParamMap({}) },
    };

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: routeMock,
        },
        { provide: TripService, useValue: tripServiceMock },
        { provide: TripAlertService, useValue: tripAlertServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
        { provide: SearchHistoryService, useValue: searchHistoryServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    spyOn(router, 'navigate').and.resolveTo(true);
    tripServiceMock.searchTrips.calls.reset();
    tripServiceMock.searchTrips.and.returnValue(of([]));
    tripAlertServiceMock.createAlert.calls.reset();
    tripAlertServiceMock.createAlert.and.returnValue(of({ id: 1 }));
    authServiceMock.isLoggedIn.and.returnValue(false);
    authServiceMock.getUser.and.returnValue(null);
    searchHistoryServiceMock.getEntries.calls.reset();
    searchHistoryServiceMock.getEntries.and.returnValue([]);
    searchHistoryServiceMock.add.calls.reset();
    searchHistoryServiceMock.clear.calls.reset();
  });

  function setQueryParams(params: Record<string, string>): void {
    const paramMap = convertToParamMap(params);
    routeMock.snapshot.queryParamMap = paramMap;
    queryParamMapSubject.next(paramMap);
  }

  it('reads from/to query params and auto-searches when both exist', () => {
    setQueryParams({ from: 'Paris', to: 'Abidjan' });
    fixture.detectChanges();

    expect(component.departureQuery).toBe('Paris');
    expect(component.destinationQuery).toBe('Abidjan');
    expect(component.departure?.name).toBe('Paris');
    expect(component.destination?.name).toBe('Abidjan');
    expect(tripServiceMock.searchTrips).toHaveBeenCalledWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: undefined,
      sort: 'price_asc',
      minPrice: null,
      maxPrice: null,
    });
  });

  it('resets stale results when navigating back to the bare search route', () => {
    setQueryParams({ from: 'Paris', to: 'Abidjan' });
    fixture.detectChanges();
    component.trips = [{ id: 1 } as Trip];
    expect(component.hasSearched).toBeTrue();

    setQueryParams({});

    expect(component.hasSearched).toBeFalse();
    expect(component.trips).toEqual([]);
    expect(component.departure).toBeNull();
    expect(component.destination).toBeNull();
  });

  it('stores complete criteria when a search is executed', () => {
    setQueryParams({ from: 'Paris', to: 'Abidjan' });
    fixture.detectChanges();
    searchHistoryServiceMock.add.calls.reset();

    component.searchTrips();

    expect(searchHistoryServiceMock.add).toHaveBeenCalledWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: undefined,
      sort: 'price_asc',
      minPrice: null,
      maxPrice: null,
    });
  });

  it('navigates with all criteria when selecting a saved search', () => {
    const entry: SearchHistoryEntry = {
      criteria: {
        departure: 'Paris',
        destination: 'Abidjan',
        date: '2026-10-01',
        sort: 'rating_desc',
        minPrice: 8,
        maxPrice: 15,
      },
      createdAt: '2026-09-21T00:00:00.000Z',
    };

    component.isSearchModalOpen = true;
    component.selectSearchHistory(entry);

    expect(component.isSearchModalOpen).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: {
        from: 'Paris',
        to: 'Abidjan',
        date: '2026-10-01',
        sort: 'rating_desc',
        minPrice: 8,
        maxPrice: 15,
      },
    });
  });

  it('clears the saved searches and local state', () => {
    component.searchHistory = [{
      criteria: { departure: 'Paris', destination: 'Abidjan' },
      createdAt: '2026-09-21T00:00:00.000Z',
    }];

    component.clearSearchHistory();

    expect(searchHistoryServiceMock.clear).toHaveBeenCalled();
    expect(component.searchHistory).toEqual([]);
  });

  it('opens a search modal from the departure field and displays recent searches', () => {
    component.isMobileViewport = true;
    component.searchHistory = [{
      criteria: { departure: 'Paris', destination: 'Abidjan', date: '2026-10-01' },
      createdAt: '2026-09-21T00:00:00.000Z',
    }];
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const departureTrigger = host.querySelector<HTMLButtonElement>('[data-testid="search-departure-trigger"]');

    expect(departureTrigger).not.toBeNull();
    expect(departureTrigger?.tagName).toBe('BUTTON');
    departureTrigger!.click();
    fixture.detectChanges();

    const modal = host.querySelector<HTMLElement>('[data-testid="search-modal"]');
    expect(modal).not.toBeNull();
    expect(modal?.querySelectorAll('input')).toHaveSize(3);
    expect(modal?.textContent).toContain('Recherches récentes');
    expect(modal?.textContent).not.toContain('Renseignez votre itinéraire ou relancez une recherche récente.');
    expect(modal?.textContent).toContain('Paris');
    expect(modal?.textContent).toContain('Abidjan');

    const historyTitle = modal?.querySelector('#search-history-title');
    expect(historyTitle?.classList.contains('text-base')).toBeTrue();
    expect(historyTitle?.classList.contains('text-lg')).toBeFalse();

    const clearButton = Array.from(modal?.querySelectorAll('button') ?? [])
      .find((button) => button.textContent?.trim() === 'Effacer');
    expect(clearButton).not.toBeUndefined();
    expect(clearButton?.getAttribute('aria-label')).toBe('Effacer l’historique des recherches');
    expect(modal?.textContent).not.toContain('Effacer l’historique');
  });

  it('focuses the destination field when the destination trigger opens the modal', fakeAsync(() => {
    component.isMobileViewport = true;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const destinationTrigger = host.querySelector<HTMLButtonElement>('[data-testid="search-destination-trigger"]');
    destinationTrigger!.click();
    fixture.detectChanges();
    flushMicrotasks();

    expect(document.activeElement?.getAttribute('placeholder')).toBe('Où allez-vous ?');
  }));

  it('keeps the inline autocomplete interactive and hides modal triggers on desktop', () => {
    component.isMobileViewport = false;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const autocomplete = host.querySelector('app-autocomplete');

    expect(host.querySelector('[data-testid="search-departure-trigger"]')).toBeNull();
    expect(host.querySelector('[data-testid="search-destination-trigger"]')).toBeNull();
    expect(autocomplete?.hasAttribute('inert')).toBeFalse();
    expect(autocomplete?.getAttribute('aria-hidden')).toBeNull();

    component.openSearchModal();

    expect(component.isSearchModalOpen).toBeFalse();
  });

  it('closes the search modal when resizing from mobile to desktop', () => {
    component.isMobileViewport = true;
    component.openSearchModal();
    expect(component.isSearchModalOpen).toBeTrue();

    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1024);
    component.onViewportResize();

    expect(component.isMobileViewport).toBeFalse();
    expect(component.isSearchModalOpen).toBeFalse();
  });

  it('does not auto-search when query params are incomplete', () => {
    setQueryParams({ from: 'Paris' });
    fixture.detectChanges();

    expect(component.departureQuery).toBe('Paris');
    expect(component.destinationQuery).toBe('');
    expect(tripServiceMock.searchTrips).not.toHaveBeenCalled();
  });

  it('does not trigger duplicate auto-search for identical params', () => {
    setQueryParams({ from: 'Paris', to: 'Abidjan' });
    fixture.detectChanges();
    setQueryParams({ from: 'Paris', to: 'Abidjan' });

    expect(tripServiceMock.searchTrips).toHaveBeenCalledTimes(1);
  });

  it('updates query params instead of searching immediately when criteria change', () => {
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.selectedDate = '2026-06-14';
    component.sort = 'departure_asc';
    component.minPrice = 8;
    component.maxPrice = 15;

    component.searchTrips();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: {
        from: 'Paris',
        to: 'Abidjan',
        date: '2026-06-14',
        sort: 'departure_asc',
        minPrice: 8,
        maxPrice: 15,
      },
    });
    expect(tripServiceMock.searchTrips).not.toHaveBeenCalled();
  });

  it('retries the search immediately when the URL already matches the current criteria', () => {
    setQueryParams({
      from: 'Paris',
      to: 'Abidjan',
      date: '2026-06-14',
      sort: 'rating_desc',
      minPrice: '8',
      maxPrice: '15',
    });
    fixture.detectChanges();
    tripServiceMock.searchTrips.calls.reset();
    (router.navigate as jasmine.Spy).calls.reset();

    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.selectedDate = '2026-06-14';
    component.sort = 'rating_desc';
    component.minPrice = 8;
    component.maxPrice = 15;

    component.searchTrips();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(tripServiceMock.searchTrips).toHaveBeenCalledOnceWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: '2026-06-14',
      sort: 'rating_desc',
      minPrice: 8,
      maxPrice: 15,
    });
  });

  it('renders the mobile filters toggle and keeps mobile filters collapsed by default', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector('[data-testid="mobile-filters-toggle"]');
    const panel = host.querySelector('[data-testid="mobile-filters-panel"]');

    expect(toggle).not.toBeNull();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(panel).toBeNull();
  });

  it('places the floating mobile filters button near the bottom edge without bottom navigation', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('[data-testid="mobile-filters-floating"]') as HTMLElement;

    expect(getComputedStyle(toggle).bottom).toBe('16px');
    expect(toggle.classList.contains('bottom-4')).toBeTrue();
    expect(toggle.classList.contains('bottom-24')).toBeFalse();
  });

  it('keeps the floating mobile filters button above the authenticated bottom navigation', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector('[data-testid="mobile-filters-floating"]') as HTMLElement;

    expect(getComputedStyle(toggle).bottom).toBe('96px');
    expect(toggle.classList.contains('bottom-4')).toBeFalse();
    expect(toggle.classList.contains('bottom-24')).toBeTrue();
  });

  it('opens and closes the mobile filters panel', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector('[data-testid="mobile-filters-toggle"]') as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(component.areMobileFiltersOpen).toBeTrue();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('[data-testid="mobile-filters-panel"]')).not.toBeNull();

    toggle.click();
    fixture.detectChanges();

    expect(component.areMobileFiltersOpen).toBeFalse();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('[data-testid="mobile-filters-panel"]')).toBeNull();
  });

  it('applies mobile draft filters together only on confirmation', () => {
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.areMobileFiltersOpen = true;
    const searchSpy = spyOn(component, 'searchTrips').and.stub();

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const ratingSort = host.querySelector('[data-testid="mobile-sort-rating_desc"]') as HTMLInputElement;
    const minPrice = host.querySelector('[data-testid="mobile-min-price"]') as HTMLInputElement;

    ratingSort.click();
    fixture.detectChanges();

    expect(component.draftSort).toBe('rating_desc');
    expect(component.sort).toBe('price_asc');
    expect(searchSpy).not.toHaveBeenCalled();

    minPrice.value = '8';
    minPrice.dispatchEvent(new Event('input'));
    minPrice.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.draftMinPrice).toBe(8);
    expect(component.minPrice).toBeNull();
    host.querySelector<HTMLButtonElement>('[data-testid=apply-mobile-filters]')!.click();
    expect(component.minPrice).toBe(8);
    expect(component.sort).toBe('rating_desc');
    expect(searchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns true for own trip and false for other trip', () => {
    authServiceMock.getUser.and.returnValue({ id: 7 });
    const ownTrip = { id: 1, travelerId: 7 } as Trip;
    const otherTrip = { id: 2, travelerId: 9 } as Trip;

    expect(component.isOwnTrip(ownTrip)).toBeTrue();
    expect(component.isOwnTrip(otherTrip)).toBeFalse();
  });

  it('does not open booking modal for own trip', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({ id: 3 });
    const ownTrip = { id: 10, travelerId: 3 } as Trip;

    component.openBookingModal(ownTrip);

    expect(component.isBookingModalOpen).toBeFalse();
    expect(component.selectedTrip).toBeNull();
  });

  it('redirects anonymous users to login with the complete search URL when booking a trip', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue(
      '/search?from=Paris&to=Abidjan&date=2026-06-14&sort=rating_desc&minPrice=8&maxPrice=15',
    );
    const trip = { id: 10, travelerId: 3 } as Trip;

    component.openBookingModal(trip);

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        returnUrl: '/search?from=Paris&to=Abidjan&date=2026-06-14&sort=rating_desc&minPrice=8&maxPrice=15',
      },
    });
    expect(component.isBookingModalOpen).toBeFalse();
    expect(component.selectedTrip).toBeNull();
  });

  it('does not start conversation for own trip', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({ id: 3 });
    const ownTrip = {
      id: 10,
      travelerId: 3,
      departureAddress: 'Paris',
      destination: 'Abidjan',
    } as Trip;

    component.contactTraveler(ownTrip);

    expect(messagingServiceMock.createConversationDraft).not.toHaveBeenCalled();
  });

  it('redirects anonymous users to login with the complete search URL when contacting a traveler', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue(
      '/search?from=Paris&to=Abidjan&date=2026-06-14&sort=rating_desc&minPrice=8&maxPrice=15',
    );
    const trip = { id: 10, travelerId: 3 } as Trip;

    component.contactTraveler(trip);

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        returnUrl: '/search?from=Paris&to=Abidjan&date=2026-06-14&sort=rating_desc&minPrice=8&maxPrice=15',
      },
    });
    expect(messagingServiceMock.createConversationDraft).not.toHaveBeenCalled();
  });

  it('treats only pending and accepted bookings as active', () => {
    component.myBookings = [
      { id: 1, tripId: 10, senderId: 1, senderName: 'Bob', title: 'A', weight: 1, recipientContact: 'a@example.com', status: 'CANCELLED', validationCodeActive: false },
      { id: 2, tripId: 10, senderId: 1, senderName: 'Bob', title: 'B', weight: 1, recipientContact: 'b@example.com', status: 'REMOVED', validationCodeActive: false },
      { id: 3, tripId: 10, senderId: 1, senderName: 'Bob', title: 'C', weight: 1, recipientContact: 'c@example.com', status: 'PENDING', validationCodeActive: false },
    ];

    expect(component.hasActiveBookingForTrip(10)).toBeTrue();

    component.myBookings = [
      { id: 4, tripId: 11, senderId: 1, senderName: 'Bob', title: 'D', weight: 1, recipientContact: 'd@example.com', status: 'CANCELLED', validationCodeActive: false },
      { id: 5, tripId: 11, senderId: 1, senderName: 'Bob', title: 'E', weight: 1, recipientContact: 'e@example.com', status: 'REMOVED', validationCodeActive: false },
      { id: 6, tripId: 11, senderId: 1, senderName: 'Bob', title: 'F', weight: 1, recipientContact: 'f@example.com', status: 'REJECTED', validationCodeActive: false },
    ];

    expect(component.hasActiveBookingForTrip(11)).toBeFalse();
  });

  it('returns true only when traveler rating data is complete', () => {
    expect(component.hasTravelerRating({
      travelerRatingAverage: 4.8,
      travelerRatingCount: 12,
    } as Trip)).toBeTrue();

    expect(component.hasTravelerRating({
      travelerRatingAverage: null,
      travelerRatingCount: 12,
    } as Trip)).toBeFalse();

    expect(component.hasTravelerRating({
      travelerRatingAverage: 4.8,
      travelerRatingCount: 0,
    } as Trip)).toBeFalse();
  });

  it('renders traveler photo and rating summary in the search results', () => {
    tripServiceMock.searchTrips.and.returnValue(of([
      {
        id: 1,
        travelerId: 14,
        travelerName: 'Alice Martin',
        travelerPhotoUrl: '/api/uploads/alice.png',
        travelerRatingAverage: 4.8,
        travelerRatingCount: 12,
        departureAddress: 'Paris',
        destination: 'Abidjan',
        departureTime: '2025-03-02T08:00:00Z',
        arrivalTime: '2025-03-02T16:00:00Z',
        maxWeight: 20,
        pricePerKilo: 15,
        instantAcceptance: true,
        status: 'ACTIVE',
        availableWeight: 8,
      },
    ]));
    setQueryParams({ from: 'Paris', to: 'Abidjan' });

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const image = host.querySelector('img[alt="Photo de profil de Alice Martin"]') as HTMLImageElement | null;

    expect(image).not.toBeNull();
    expect(image?.getAttribute('src')).toBe('/api/uploads/alice.png');
    expect(host.textContent).toContain('4.8');
    expect(host.textContent).toContain('12 avis');
  });

  it('renders the not found card when a search has no result', () => {
    tripServiceMock.searchTrips.and.returnValue(of([]));
    setQueryParams({ from: 'Paris', to: 'Abidjan' });

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const publishLink = host.querySelector('a[aria-label="Publier ma demande"]');
    const alertButton = host.querySelector('button[aria-label="M\'alerter dès qu\'un trajet arrive"]');

    expect(host.textContent).toContain('Aucun trajet trouvé');
    expect(host.textContent).toContain('Créez une alerte');
    expect(host.textContent).toContain('publiez votre besoin');
    expect(publishLink?.getAttribute('href')).toBe('/parcel-requests/new?from=Paris&to=Abidjan');
    expect(alertButton).not.toBeNull();
    expect(alertButton?.textContent).toContain("M'alerter");
    expect(alertButton?.textContent).not.toContain("dès qu'un trajet arrive");
    expect(host.querySelector('h2.text-xl')).not.toBeNull();
    expect(publishLink?.classList.contains('min-h-12')).toBeTrue();
    expect(alertButton?.classList.contains('min-h-12')).toBeTrue();
  });

  it('redirects to login when creating an alert while unauthenticated', () => {
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", isoCode: 'CI', type: 'CITY' };

    component.createAlertForCurrentSearch();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(tripAlertServiceMock.createAlert).not.toHaveBeenCalled();
  });

  it('creates an alert from the current search criteria', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.selectedDate = '2026-06-20';
    component.sort = 'departure_asc';
    component.minPrice = 5;
    component.maxPrice = 15;

    component.createAlertForCurrentSearch();

    expect(tripAlertServiceMock.createAlert).toHaveBeenCalledOnceWith({
      departure: 'Paris',
      destination: 'Abidjan',
      date: '2026-06-20',
      sort: 'departure_asc',
      minPrice: 5,
      maxPrice: 15,
    });
    expect(component.isCreatingAlert).toBeFalse();
    expect(component.alertSuccessMessage).toContain('Alerte activee');
  });

  it('shows a dedicated message when the alert already exists', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    tripAlertServiceMock.createAlert.and.returnValue(of({ id: 1, alreadyExists: true }));
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", isoCode: 'CI', type: 'CITY' };

    component.createAlertForCurrentSearch();

    expect(component.alertSuccessMessage).toContain('deja active');
  });

  it('shows an error when alert creation fails', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    tripAlertServiceMock.createAlert.and.returnValue(throwError(() => new Error('failed')));
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", isoCode: 'CI', type: 'CITY' };

    component.createAlertForCurrentSearch();

    expect(component.isCreatingAlert).toBeFalse();
    expect(component.alertErrorMessage).toContain("Impossible de creer l'alerte");
  });

  it('renders traveler initials fallback when no photo is available', () => {
    tripServiceMock.searchTrips.and.returnValue(of([
      {
        id: 1,
        travelerId: 14,
        travelerName: 'Alice Martin',
        travelerPhotoUrl: undefined,
        travelerRatingAverage: 4.8,
        travelerRatingCount: 12,
        departureAddress: 'Paris',
        destination: 'Abidjan',
        departureTime: '2025-03-02T08:00:00Z',
        arrivalTime: '2025-03-02T16:00:00Z',
        maxWeight: 20,
        pricePerKilo: 15,
        instantAcceptance: true,
        status: 'ACTIVE',
        availableWeight: 8,
      },
    ]));
    setQueryParams({ from: 'Paris', to: 'Abidjan' });

    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const fallback = host.querySelector('[data-testid="user-avatar-fallback"]');

    expect(fallback?.textContent?.trim()).toBe('AM');
  });
  it('shows a compact summary for a complete route and lets the user edit it', () => {
    component.isMobileViewport = true;
    setQueryParams({ from: 'Paris', to: 'Lyon', date: '2026-09-04' });
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('[data-testid=mobile-search-summary]');
    expect(summary.textContent).toContain('Paris');
    expect(summary.textContent).toContain('4 sept. 2026');
    summary.click();
    fixture.detectChanges();

    expect(component.isSearchModalOpen).toBeTrue();
    expect(component.isMobileSearchEditing).toBeFalse();
    expect(fixture.nativeElement.querySelector('[data-testid="search-modal"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Formulaire de recherche"]')?.classList.contains('hidden')).toBeTrue();
  });

  it('uses compact search fields only inside the mobile search modal', () => {
    component.isMobileViewport = true;
    component.openSearchModal();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const modal = host.querySelector<HTMLElement>('[data-testid="search-modal"]')!;
    const modalHeader = modal.querySelector<HTMLElement>('#search-modal-title')?.parentElement?.parentElement;
    const closeButton = modal.querySelector<HTMLButtonElement>('[aria-label="Fermer la recherche"]');
    const modalAutocompleteInputs = Array.from(
      modal.querySelectorAll<HTMLInputElement>('.search-modal-departure input, .search-modal-destination input')
    );
    const dateInput = modal.querySelector<HTMLInputElement>('input[type="date"]')!;
    const regularSearchInput = host.querySelector<HTMLInputElement>(
      '[aria-label="Formulaire de recherche"] app-autocomplete input'
    )!;

    expect(modalAutocompleteInputs.length).toBe(2);
    expect(modalHeader?.classList.contains('py-2')).toBeTrue();
    expect(closeButton?.classList.contains('min-h-11')).toBeTrue();
    expect(modalAutocompleteInputs.every((input) => input.classList.contains('min-h-[64px]'))).toBeTrue();
    expect(dateInput.closest('label')?.classList.contains('h-16')).toBeTrue();
    expect(regularSearchInput.classList.contains('min-h-[76px]')).toBeTrue();
  });

  it('restores the compact search summary when the edit modal is closed', () => {
    component.isMobileViewport = true;
    setQueryParams({ from: 'Nantes', to: 'Paris' });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const summary = host.querySelector<HTMLButtonElement>('[data-testid="mobile-search-summary"]');
    summary!.click();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="search-modal"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="mobile-search-summary"]')).toBeNull();

    component.closeSearchModal();
    fixture.detectChanges();

    expect(host.querySelector('[data-testid="search-modal"]')).toBeNull();
    expect(host.querySelector('[data-testid="mobile-search-summary"]')).not.toBeNull();
    expect(host.querySelector('[aria-label="Formulaire de recherche"]')?.classList.contains('hidden')).toBeTrue();
  });

  it('restores the compact summary when the modal close button is clicked', () => {
    component.isMobileViewport = true;
    setQueryParams({ from: 'Nantes', to: 'Paris' });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('[data-testid="mobile-search-summary"]')!.click();
    fixture.detectChanges();

    host.querySelector<HTMLButtonElement>('[aria-label="Fermer la recherche"]')!.click();
    fixture.detectChanges();

    expect(component.isSearchModalOpen).toBeFalse();
    expect(host.querySelector('[data-testid="mobile-search-summary"]')).not.toBeNull();
  });

  it('discards draft edits on Escape and restores body scrolling', () => {
    component.minPrice = 0;
    component.maxPrice = 20;
    const overflow = document.body.style.overflow;
    component.toggleMobileFilters();
    component.draftMinPrice = 10;
    expect(document.body.style.overflow).toBe('hidden');
    component.onFilterKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.minPrice).toBe(0);
    expect(component.activeFilterCount).toBe(2);
    expect(document.body.style.overflow).toBe(overflow);
    component.toggleMobileFilters();
    expect(component.draftMinPrice).toBe(0);
    component.closeMobileFilters();
  });

  it('opens the same panel from the floating button and removes applied bounds', () => {
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid=mobile-filters-floating]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=dialog]')).not.toBeNull();
    component.closeMobileFilters();
    component.maxPrice = 20;
    const change = spyOn(component, 'onFilterChange');
    component.removePriceFilter('maxPrice');
    expect(component.activeFilterCount).toBe(0);
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('formats prices and identifies arrivals on another day', () => {
    expect(component.formatPrice(18)).toBe('18,00');
    expect(component.arrivesAnotherDay({ departureTime: '2026-09-04T08:00:00', arrivalTime: '2026-09-05T08:00:00' } as Trip)).toBeTrue();
    expect(component.arrivesAnotherDay({ departureTime: '2026-09-04T08:00:00', arrivalTime: '2026-09-04T13:00:00' } as Trip)).toBeFalse();
  });

  it('keeps the initial form visible until the first search is submitted', () => {
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Lyon', country: 'France', isoCode: 'FR', type: 'CITY' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid=mobile-search-summary]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Formulaire de recherche"]').classList.contains('hidden')).toBeFalse();
  });

  it('renders mobile trip details and preserves booking states', () => {
    const trip = {
      id: 1, travelerId: 14, travelerName: 'Un nom de voyageur particulièrement long',
      departureAddress: 'Paris', destination: 'Lyon',
      departureTime: '2026-09-04T23:00:00', arrivalTime: '2026-09-05T08:00:00',
      pricePerKilo: 18, maxWeight: 20, availableWeight: 10, instantAcceptance: true, status: 'ACTIVE',
    } as Trip;
    tripServiceMock.searchTrips.and.returnValue(of([trip]));
    setQueryParams({ from: 'Paris', to: 'Lyon' });
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('[data-testid=mobile-trip-card]') as HTMLElement;
    expect(card.textContent).toContain('18,00 €/kg');
    expect(card.textContent).toContain('Confirmation instantanée');
    expect(card.textContent).toContain(component.formatDate(trip.arrivalTime));
    expect(card.textContent).toContain('Nouveau');
    const reserve = spyOn(component, 'openBookingModal');
    card.querySelector('button')!.click();
    expect(reserve).toHaveBeenCalledWith(trip);
    trip.instantAcceptance = false;
    component.myBookings = [{ tripId: 1, status: 'PENDING' } as any];
    fixture.detectChanges();
    expect(card.textContent).not.toContain('Confirmation instantanée');
    expect(card.textContent).toContain('Demande envoyée');
    expect(card.querySelector('button')).toBeNull();
    authServiceMock.getUser.and.returnValue({ id: 14 });
    fixture.detectChanges();
    expect(card.textContent).toContain('Votre trajet');
  });

  it('preserves calendar dates across month, year and leap-day boundaries', () => {
    expect(component.formatDate('2026-09-04')).toBe('4 sept. 2026');
    expect(component.formatDate('2026-01-01')).toBe('1 janv. 2026');
    expect(component.formatDate('2028-02-29')).toBe('29 févr. 2028');
  });

  it('continues formatting trip timestamps in the local time zone', () => {
    const timestamp = '2026-09-04T00:30:00Z';
    const expected = new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    expect(component.formatDate(timestamp)).toBe(expected);
  });

});
