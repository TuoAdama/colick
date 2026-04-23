import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { SearchPageComponent } from './search-page.component';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { LocationService } from '../../services/location.service';

describe('SearchPageComponent', () => {
  let fixture: ComponentFixture<SearchPageComponent>;
  let component: SearchPageComponent;
  let queryParamMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const tripServiceMock = {
    searchTrips: jasmine.createSpy('searchTrips').and.returnValue(of([])),
    createBooking: jasmine.createSpy('createBooking'),
  };

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(false),
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
});
