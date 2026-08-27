import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { SearchPageComponent } from './search-page.component';
import { TripService } from '../../services/trip.service';
import { TripAlertService } from '../../services/trip-alert.service';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { LocationService } from '../../services/location.service';
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

  it('uses shared filter values and triggers search from mobile filter controls', () => {
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

    expect(component.sort).toBe('rating_desc');
    expect(searchSpy).toHaveBeenCalledTimes(1);

    minPrice.value = '8';
    minPrice.dispatchEvent(new Event('input'));
    minPrice.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.minPrice).toBe(8);
    expect(searchSpy).toHaveBeenCalledTimes(2);
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
});
