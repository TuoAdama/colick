import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { SearchPageComponent } from './search-page.component';
import { TripService } from '../../services/trip.service';
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
    expect(tripServiceMock.searchTrips).toHaveBeenCalledWith('Paris', 'Abidjan');
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
    component.departure = { id: 1, name: 'Paris', country: 'France', type: 'city' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", type: 'city' };

    component.searchTrips();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: { from: 'Paris', to: 'Abidjan' },
    });
    expect(tripServiceMock.searchTrips).not.toHaveBeenCalled();
  });

  it('retries the search immediately when the URL already matches the current criteria', () => {
    setQueryParams({ from: 'Paris', to: 'Abidjan' });
    fixture.detectChanges();
    tripServiceMock.searchTrips.calls.reset();
    (router.navigate as jasmine.Spy).calls.reset();

    component.departure = { id: 1, name: 'Paris', country: 'France', type: 'city' };
    component.destination = { id: 2, name: 'Abidjan', country: "Cote d'Ivoire", type: 'city' };

    component.searchTrips();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(tripServiceMock.searchTrips).toHaveBeenCalledOnceWith('Paris', 'Abidjan');
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

    expect(messagingServiceMock.startConversation).not.toHaveBeenCalled();
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
});
