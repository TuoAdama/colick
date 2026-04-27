import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { SearchPageComponent } from './search-page.component';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { LocationService } from '../../services/location.service';
import { Trip } from '../../models/trip.model';

describe('SearchPageComponent', () => {
  let fixture: ComponentFixture<SearchPageComponent>;
  let component: SearchPageComponent;
  let queryParamMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

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

    await TestBed.configureTestingModule({
      imports: [SearchPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParamMapSubject.asObservable() },
        },
        { provide: TripService, useValue: tripServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    tripServiceMock.searchTrips.calls.reset();
  });

  it('reads from/to query params and auto-searches when both exist', () => {
    queryParamMapSubject.next(convertToParamMap({ from: 'Paris', to: 'Abidjan' }));
    fixture.detectChanges();

    expect(component.departureQuery).toBe('Paris');
    expect(component.destinationQuery).toBe('Abidjan');
    expect(component.departure?.name).toBe('Paris');
    expect(component.destination?.name).toBe('Abidjan');
    expect(tripServiceMock.searchTrips).toHaveBeenCalledWith('Paris', 'Abidjan');
  });

  it('does not auto-search when query params are incomplete', () => {
    queryParamMapSubject.next(convertToParamMap({ from: 'Paris' }));
    fixture.detectChanges();

    expect(component.departureQuery).toBe('Paris');
    expect(component.destinationQuery).toBe('');
    expect(tripServiceMock.searchTrips).not.toHaveBeenCalled();
  });

  it('does not trigger duplicate auto-search for identical params', () => {
    queryParamMapSubject.next(convertToParamMap({ from: 'Paris', to: 'Abidjan' }));
    fixture.detectChanges();
    queryParamMapSubject.next(convertToParamMap({ from: 'Paris', to: 'Abidjan' }));

    expect(tripServiceMock.searchTrips).toHaveBeenCalledTimes(1);
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
});
