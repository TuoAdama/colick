import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { TripCompletionPageComponent } from './trip-completion-page.component';

describe('TripCompletionPageComponent', () => {
  let fixture: ComponentFixture<TripCompletionPageComponent>;
  let component: TripCompletionPageComponent;
  let router: Router;

  const tripParamMap$ = new BehaviorSubject(convertToParamMap({ tripId: '12' }));

  const tripServiceMock = {
    getTripById: jasmine.createSpy('getTripById'),
    getTripBookings: jasmine.createSpy('getTripBookings'),
    confirmBookingDelivery: jasmine.createSpy('confirmBookingDelivery'),
    completeTrip: jasmine.createSpy('completeTrip'),
  };

  const authServiceMock = {
    getUser: jasmine.createSpy('getUser').and.returnValue({
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      hasPassword: true,
      photoUrl: null,
    }),
    logout: jasmine.createSpy('logout'),
  };

  beforeEach(async () => {
    tripParamMap$.next(convertToParamMap({ tripId: '12' }));
    tripServiceMock.getTripById.calls.reset();
    tripServiceMock.getTripBookings.calls.reset();
    tripServiceMock.confirmBookingDelivery.calls.reset();
    tripServiceMock.completeTrip.calls.reset();
    authServiceMock.getUser.calls.reset();
    authServiceMock.logout.calls.reset();

    tripServiceMock.getTripById.and.returnValue(of(buildTrip()));
    tripServiceMock.getTripBookings.and.returnValue(of([buildAcceptedBooking()]));
    tripServiceMock.confirmBookingDelivery.and.returnValue(of({
      ...buildAcceptedBooking(),
      deliveredAt: '2025-07-18T12:00:00',
      validationCodeActive: false,
    }));
    tripServiceMock.completeTrip.and.returnValue(of({ ...buildTrip(), status: 'COMPLETED' }));

    await TestBed.configureTestingModule({
      imports: [TripCompletionPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: tripParamMap$.asObservable(),
          },
        },
        { provide: TripService, useValue: tripServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(TripCompletionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads trip and only shows accepted bookings for validation', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildAcceptedBooking({ id: 1 }),
      buildAcceptedBooking({ id: 2, status: 'PENDING' }),
      buildAcceptedBooking({ id: 3, status: 'ACCEPTED' }),
    ]));

    createComponent();

    expect(component.acceptedBookings().map((booking) => booking.id)).toEqual([1, 3]);
  });

  it('renders the completion content without the shell wrapper', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Validation des codes de livraison');
  });

  it('validates a booking code and updates the booking state', () => {
    createComponent();
    component.updateCodeInput(7, '123456');

    component.validateBookingCode(7);

    expect(tripServiceMock.confirmBookingDelivery).toHaveBeenCalledWith(12, 7, {
      validationCode: '123456',
    });
    expect(component.acceptedBookings()[0].deliveredAt).toBe('2025-07-18T12:00:00');
  });

  it('does not validate when the code format is invalid', () => {
    createComponent();
    component.updateCodeInput(7, '1234');

    component.validateBookingCode(7);

    expect(tripServiceMock.confirmBookingDelivery).not.toHaveBeenCalled();
    expect(component.actionError).toBe('Saisissez un code de validation à 6 chiffres.');
  });

  it('finalizes the trip once all accepted bookings are validated', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildAcceptedBooking({ id: 7, deliveredAt: '2025-07-18T12:00:00', validationCodeActive: false }),
    ]));

    createComponent();
    component.finalizeTrip();

    expect(tripServiceMock.completeTrip).toHaveBeenCalledWith(12);
    expect(router.navigate).toHaveBeenCalledWith(['/trips', 12, 'reservations']);
  });

  it('shows a loading error message when data cannot be loaded', () => {
    tripServiceMock.getTripById.and.returnValue(throwError(() => new Error('boom')));
    tripServiceMock.getTripBookings.and.returnValue(throwError(() => new Error('boom')));

    createComponent();

    expect(component.loadError).toBe('Impossible de charger cette page de validation.');
  });
});

function buildTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 12,
    travelerId: 1,
    travelerName: 'Ada Lovelace',
    departureAddress: 'Paris, France',
    destination: "Abidjan, Côte d'Ivoire",
    departureTime: '2025-07-14T08:00:00',
    arrivalTime: '2025-07-14T16:00:00',
    maxWeight: 20,
    pricePerKilo: 15,
    instantAcceptance: true,
    status: 'ACTIVE',
    availableWeight: 8,
    ...overrides,
  };
}

function buildAcceptedBooking(overrides: Partial<BookingResponse> = {}): BookingResponse {
  return {
    id: 7,
    tripId: 12,
    senderId: 55,
    senderName: 'Grace Hopper',
    title: 'Documents',
    weight: 2,
    description: 'Dossier important',
    recipientContact: '+22501020304',
    status: 'ACCEPTED',
    validationCodeActive: true,
    ...overrides,
  };
}
