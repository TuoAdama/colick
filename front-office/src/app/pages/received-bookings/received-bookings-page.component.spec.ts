import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { UserResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { ShareCardMapperService } from '../../services/share-card-mapper.service';
import { TripService } from '../../services/trip.service';
import { ReceivedBookingsPageComponent } from './received-bookings-page.component';

describe('ReceivedBookingsPageComponent', () => {
  let fixture: ComponentFixture<ReceivedBookingsPageComponent>;
  let component: ReceivedBookingsPageComponent;

  const currentUser$ = new BehaviorSubject<UserResponse>({
    id: 1,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'USER',
    phone: '+33 6 00 00 00 00',
    identityDocument: 'AA123456',
    hasPassword: true,
  });

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
    getUser: jasmine.createSpy('getUser').and.callFake(() => currentUser$.getValue()),
    currentUser$,
  };

  const tripServiceMock = {
    getMyTrips: jasmine.createSpy('getMyTrips').and.returnValue(of([])),
    getTripBookings: jasmine.createSpy('getTripBookings').and.returnValue(of([])),
    completeTrip: jasmine.createSpy('completeTrip').and.returnValue(of()),
    cancelTrip: jasmine.createSpy('cancelTrip').and.returnValue(of(void 0)),
  };

  const shareCardMapperServiceMock = {
    mapActiveTripToShareCard: jasmine.createSpy('mapActiveTripToShareCard').and.returnValue({
      departureCity: 'Paris',
      destinationCity: 'Abidjan',
      routeLabel: 'Paris → Abidjan',
      formattedDateTime: '14 mars 2024 • 10:30',
      formattedDate: '14 Mars 2024',
      formattedTime: '10:30',
      travelerName: 'Ada Lovelace',
      phone: '+33 6 00 00 00 00',
      email: 'ada@example.com',
      availableWeightLabel: '8 kg',
      pricePerKiloLabel: '10,00 € / kg',
    }),
    buildFileDate: jasmine.createSpy('buildFileDate').and.returnValue('2025-07-14'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedBookingsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ShareCardMapperService, useValue: shareCardMapperServiceMock },
        { provide: TripService, useValue: tripServiceMock },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ReceivedBookingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
