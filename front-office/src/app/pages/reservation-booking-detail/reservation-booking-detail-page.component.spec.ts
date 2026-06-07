import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { ReservationBookingDetailPageComponent } from './reservation-booking-detail-page.component';

describe('ReservationBookingDetailPageComponent', () => {
  let fixture: ComponentFixture<ReservationBookingDetailPageComponent>;
  let component: ReservationBookingDetailPageComponent;
  let router: Router;

  const tripParamMap$ = new BehaviorSubject(convertToParamMap({ tripId: '12', bookingId: '7' }));

  const tripServiceMock = {
    getTripById: jasmine.createSpy('getTripById'),
    getTripBookings: jasmine.createSpy('getTripBookings'),
    acceptBooking: jasmine.createSpy('acceptBooking'),
    rejectBooking: jasmine.createSpy('rejectBooking'),
    removeBooking: jasmine.createSpy('removeBooking'),
    confirmBookingDelivery: jasmine.createSpy('confirmBookingDelivery'),
  };

  const messagingServiceMock = {
    startConversation: jasmine.createSpy('startConversation'),
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
    tripParamMap$.next(convertToParamMap({ tripId: '12', bookingId: '7' }));
    tripServiceMock.getTripById.calls.reset();
    tripServiceMock.getTripBookings.calls.reset();
    tripServiceMock.acceptBooking.calls.reset();
    tripServiceMock.rejectBooking.calls.reset();
    tripServiceMock.removeBooking.calls.reset();
    tripServiceMock.confirmBookingDelivery.calls.reset();
    messagingServiceMock.startConversation.calls.reset();
    authServiceMock.getUser.calls.reset();
    authServiceMock.logout.calls.reset();

    tripServiceMock.getTripById.and.returnValue(of(buildTrip()));
    tripServiceMock.getTripBookings.and.returnValue(of([buildBooking()]));
    tripServiceMock.acceptBooking.and.returnValue(of({ ...buildBooking(), status: 'ACCEPTED' }));
    tripServiceMock.rejectBooking.and.returnValue(of({ ...buildBooking(), status: 'REJECTED' }));
    tripServiceMock.removeBooking.and.returnValue(of(void 0));
    tripServiceMock.confirmBookingDelivery.and.returnValue(of({
      ...buildBooking(),
      status: 'ACCEPTED',
      validationCodeActive: false,
      deliveredAt: '2025-07-15T10:00:00',
    }));
    messagingServiceMock.startConversation.and.returnValue(of({
      id: 1,
      tripId: 12,
      tripRoute: 'Paris → Abidjan',
      otherParticipantId: 55,
      otherParticipantName: 'Grace Hopper',
      lastMessage: 'Bonjour',
      unreadCount: 0,
      createdAt: '2025-07-15T09:00:00',
    }));

    await TestBed.configureTestingModule({
      imports: [ReservationBookingDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: tripParamMap$.asObservable(),
          },
        },
        { provide: TripService, useValue: tripServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ReservationBookingDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the selected booking and renders its core information', () => {
    createComponent();

    expect(component.booking?.id).toBe(7);
    expect(fixture.nativeElement.textContent).toContain('Documents');
    expect(fixture.nativeElement.textContent).toContain('Récapitulatif financier');
    expect(fixture.nativeElement.textContent).toContain('Juillet');
  });

  it('shows an error state when the targeted booking cannot be found', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([buildBooking({ id: 99 })]));

    createComponent();

    expect(component.booking).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Impossible de retrouver cette réservation pour ce trajet.');
  });

  it('starts a conversation with the sender and navigates to messages', () => {
    createComponent();

    component.messageSender();

    expect(messagingServiceMock.startConversation).toHaveBeenCalledWith({
      tripId: 12,
      recipientId: 55,
      content: 'Bonjour, je vous contacte au sujet de votre réservation "Documents" pour mon trajet Paris, France vers Abidjan, Côte d\'Ivoire.',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages']);
  });

  it('accepts the booking and updates the page state', () => {
    createComponent();

    component.acceptBooking();

    expect(tripServiceMock.acceptBooking).toHaveBeenCalledWith(12, 7);
    expect(component.booking?.status).toBe('ACCEPTED');
  });

  it('confirms the booking delivery with the entered code', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildBooking({
        status: 'ACCEPTED',
        validationCodeActive: true,
      }),
    ]));

    createComponent();
    component.deliveryCode = '123456';

    component.confirmBookingDelivery();

    expect(tripServiceMock.confirmBookingDelivery).toHaveBeenCalledWith(12, 7, {
      validationCode: '123456',
    });
    expect(component.booking?.deliveredAt).toBe('2025-07-15T10:00:00');
  });

  it('removes the booking and navigates back to the reservations list', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([
      buildBooking({
        status: 'ACCEPTED',
      }),
    ]));

    createComponent();
    component.openRemoveBookingModal();
    component.confirmRemoveBooking();

    expect(tripServiceMock.removeBooking).toHaveBeenCalledWith(12, 7);
    expect(router.navigate).toHaveBeenCalledWith(['/trips', 12, 'reservations']);
  });

  it('shows an error state when the booking detail request fails', () => {
    tripServiceMock.getTripById.and.returnValue(throwError(() => new Error('boom')));
    tripServiceMock.getTripBookings.and.returnValue(throwError(() => new Error('boom')));

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les détails de cette réservation.');
  });
});

function buildTrip(): Trip {
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
    status: 'COMPLETED',
    availableWeight: 8,
  };
}

function buildBooking(overrides: Partial<BookingResponse> = {}): BookingResponse {
  return {
    id: 7,
    tripId: 12,
    senderId: 55,
    senderName: 'Grace Hopper',
    title: 'Documents',
    weight: 2,
    description: 'Dossier important',
    recipientContact: '+22501020304',
    status: 'PENDING',
    validationCodeActive: false,
    ...overrides,
  };
}
