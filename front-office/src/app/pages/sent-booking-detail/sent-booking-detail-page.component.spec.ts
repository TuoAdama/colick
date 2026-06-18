import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { SentBookingDetailPageComponent } from './sent-booking-detail-page.component';

describe('SentBookingDetailPageComponent', () => {
  let fixture: ComponentFixture<SentBookingDetailPageComponent>;
  let component: SentBookingDetailPageComponent;
  let router: Router;

  const paramMap$ = new BehaviorSubject(convertToParamMap({ tripId: '12', bookingId: '7' }));

  const tripServiceMock = {
    getTripById: jasmine.createSpy('getTripById'),
    getTripBookingById: jasmine.createSpy('getTripBookingById'),
    cancelBooking: jasmine.createSpy('cancelBooking'),
  };

  const messagingServiceMock = {
    createConversationDraft: jasmine.createSpy('createConversationDraft'),
  };

  beforeEach(async () => {
    paramMap$.next(convertToParamMap({ tripId: '12', bookingId: '7' }));
    tripServiceMock.getTripById.calls.reset();
    tripServiceMock.getTripBookingById.calls.reset();
    tripServiceMock.cancelBooking.calls.reset();
    messagingServiceMock.createConversationDraft.calls.reset();

    tripServiceMock.getTripById.and.returnValue(of(buildTrip()));
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking()));
    tripServiceMock.cancelBooking.and.returnValue(of({ ...buildBooking(), status: 'CANCELLED' }));
    messagingServiceMock.createConversationDraft.and.returnValue(of({
      id: 3,
      tripId: 12,
      tripRoute: 'Paris → Abidjan',
      otherParticipantId: 1,
      otherParticipantName: 'Ada Lovelace',
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2025-07-15T09:00:00',
    }));

    await TestBed.configureTestingModule({
      imports: [SentBookingDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
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
    fixture = TestBed.createComponent(SentBookingDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the trip and sent booking detail', () => {
    createComponent();

    expect(tripServiceMock.getTripById).toHaveBeenCalledWith(12);
    expect(tripServiceMock.getTripBookingById).toHaveBeenCalledWith(12, 7);
    expect(fixture.nativeElement.textContent).toContain('Documents');
    expect(fixture.nativeElement.textContent).toContain('Paris, France');
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('alice@example.com');
  });

  it('redirects to 404 when the booking cannot be found', () => {
    tripServiceMock.getTripBookingById.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    createComponent();

    expect(component.booking).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/404']);
  });

  it('starts a draft conversation with the traveler', () => {
    createComponent();

    component.messageTraveler();

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({
      tripId: 12,
      recipientId: 1,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], { queryParams: { conversationId: 3 } });
  });

  it('cancels a cancellable sent booking', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    createComponent();

    component.cancelBooking();

    expect(tripServiceMock.cancelBooking).toHaveBeenCalledWith(12, 7);
    expect(component.booking?.status).toBe('CANCELLED');
  });

  it('does not show cancel action for rejected bookings', () => {
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking({ status: 'REJECTED' })));

    createComponent();

    expect(component.canCancelBooking()).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Annuler la demande');
  });
});

function buildTrip(): Trip {
  return {
    id: 12,
    travelerId: 1,
    travelerName: 'Ada Lovelace',
    travelerRatingAverage: 4.8,
    travelerRatingCount: 24,
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

function buildBooking(overrides: Partial<BookingResponse> = {}): BookingResponse {
  return {
    id: 7,
    tripId: 12,
    senderId: 55,
    senderName: 'Grace Hopper',
    title: 'Documents',
    weight: 2,
    description: 'Dossier important',
    recipientContact: 'alice@example.com',
    status: 'PENDING',
    validationCodeActive: false,
    createdAt: '2025-07-10T09:30:00Z',
    ...overrides,
  };
}
