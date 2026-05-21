import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { ReservationDetailsPageComponent } from './reservation-details-page.component';

describe('ReservationDetailsPageComponent', () => {
  let fixture: ComponentFixture<ReservationDetailsPageComponent>;
  let component: ReservationDetailsPageComponent;
  let router: Router;

  const tripParamMap$ = new BehaviorSubject(convertToParamMap({ tripId: '12' }));

  const tripServiceMock = {
    getTripById: jasmine.createSpy('getTripById'),
    getTripBookings: jasmine.createSpy('getTripBookings'),
    acceptBooking: jasmine.createSpy('acceptBooking'),
    rejectBooking: jasmine.createSpy('rejectBooking'),
    removeBooking: jasmine.createSpy('removeBooking'),
    completeTrip: jasmine.createSpy('completeTrip'),
    cancelTrip: jasmine.createSpy('cancelTrip'),
    confirmBookingDelivery: jasmine.createSpy('confirmBookingDelivery'),
  };

  const messagingServiceMock = {
    startConversation: jasmine.createSpy('startConversation'),
  };

  beforeEach(async () => {
    tripParamMap$.next(convertToParamMap({ tripId: '12' }));
    tripServiceMock.getTripById.calls.reset();
    tripServiceMock.getTripBookings.calls.reset();
    tripServiceMock.acceptBooking.calls.reset();
    tripServiceMock.rejectBooking.calls.reset();
    tripServiceMock.removeBooking.calls.reset();
    tripServiceMock.completeTrip.calls.reset();
    tripServiceMock.cancelTrip.calls.reset();
    tripServiceMock.confirmBookingDelivery.calls.reset();
    messagingServiceMock.startConversation.calls.reset();

    tripServiceMock.getTripById.and.returnValue(of(buildTrip()));
    tripServiceMock.getTripBookings.and.returnValue(of([buildBooking()]));
    tripServiceMock.acceptBooking.and.returnValue(of({ ...buildBooking(), status: 'ACCEPTED' }));
    tripServiceMock.rejectBooking.and.returnValue(of({ ...buildBooking(), status: 'REJECTED' }));
    tripServiceMock.removeBooking.and.returnValue(of(void 0));
    tripServiceMock.completeTrip.and.returnValue(of({ ...buildTrip(), status: 'COMPLETED' }));
    tripServiceMock.cancelTrip.and.returnValue(of(void 0));
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
      imports: [ReservationDetailsPageComponent],
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
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ReservationDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('shows a loading state while reservation details are being fetched', () => {
    const tripSubject = new Subject<Trip>();
    const bookingsSubject = new Subject<BookingResponse[]>();
    tripServiceMock.getTripById.and.returnValue(tripSubject.asObservable());
    tripServiceMock.getTripBookings.and.returnValue(bookingsSubject.asObservable());

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Chargement des demandes');
  });

  it('shows an error state when the reservation details request fails', () => {
    tripServiceMock.getTripById.and.returnValue(throwError(() => new Error('boom')));
    tripServiceMock.getTripBookings.and.returnValue(throwError(() => new Error('boom')));

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les détails de cette réservation.');
  });

  it('accepts a booking and updates it in the page state', () => {
    createComponent();

    component.acceptBooking(7);

    expect(tripServiceMock.acceptBooking).toHaveBeenCalledWith(12, 7);
    expect(component.bookings[0].status).toBe('ACCEPTED');
  });

  it('rejects a booking and updates it in the page state', () => {
    createComponent();

    component.rejectBooking(7);

    expect(tripServiceMock.rejectBooking).toHaveBeenCalledWith(12, 7);
    expect(component.bookings[0].status).toBe('REJECTED');
  });

  it('removes a booking after confirmation', () => {
    createComponent();

    component.openRemoveBookingModal(7);
    component.confirmRemoveBooking();

    expect(tripServiceMock.removeBooking).toHaveBeenCalledWith(12, 7);
    expect(component.bookings).toEqual([]);
    expect(component.isRemoveBookingModalOpen).toBeFalse();
  });

  it('starts a conversation with the sender and navigates to messages', () => {
    createComponent();

    component.messageSender(7);

    expect(messagingServiceMock.startConversation).toHaveBeenCalledWith({
      tripId: 12,
      recipientId: 55,
      content: 'Bonjour, je vous contacte au sujet de votre réservation "Documents" pour mon trajet Paris, France vers Abidjan, Côte d\'Ivoire.',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages']);
  });

  it('marks the trip as completed', () => {
    createComponent();

    component.markTripCompleted();

    expect(tripServiceMock.completeTrip).toHaveBeenCalledWith(12);
    expect(component.trip?.status).toBe('COMPLETED');
  });

  it('cancels the trip and navigates back to the dashboard received tab', () => {
    createComponent();

    component.openCancelTripModal();
    component.confirmCancelTrip();

    expect(tripServiceMock.cancelTrip).toHaveBeenCalledWith(12);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard'], {
      queryParams: { tab: 'received' },
    });
  });

  it('confirms a booking delivery with the provided validation code', () => {
    createComponent();

    component.confirmBookingDelivery({ bookingId: 7, code: '123456' });

    expect(tripServiceMock.confirmBookingDelivery).toHaveBeenCalledWith(12, 7, {
      validationCode: '123456',
    });
    expect(component.bookings[0].deliveredAt).toBe('2025-07-15T10:00:00');
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
    status: 'ACTIVE',
    availableWeight: 8,
  };
}

function buildBooking(): BookingResponse {
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
  };
}
