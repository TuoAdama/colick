import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BookingResponse, BookingSenderProfileResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { MessagingService } from '../../services/messaging.service';
import { TripService } from '../../services/trip.service';
import { ReservationSenderProfilePageComponent } from './reservation-sender-profile-page.component';

describe('ReservationSenderProfilePageComponent', () => {
  let fixture: ComponentFixture<ReservationSenderProfilePageComponent>;
  let component: ReservationSenderProfilePageComponent;
  let router: Router;

  const tripParamMap$ = new BehaviorSubject(convertToParamMap({ tripId: '12', bookingId: '7' }));

  const tripServiceMock = {
    getTripById: jasmine.createSpy('getTripById'),
    getTripBookings: jasmine.createSpy('getTripBookings'),
    getBookingSenderProfile: jasmine.createSpy('getBookingSenderProfile'),
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
    tripServiceMock.getBookingSenderProfile.calls.reset();
    messagingServiceMock.startConversation.calls.reset();
    authServiceMock.getUser.calls.reset();
    authServiceMock.logout.calls.reset();

    tripServiceMock.getTripById.and.returnValue(of(buildTrip()));
    tripServiceMock.getTripBookings.and.returnValue(of([buildBooking()]));
    tripServiceMock.getBookingSenderProfile.and.returnValue(of(buildSenderProfile()));
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
      imports: [ReservationSenderProfilePageComponent],
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
    fixture = TestBed.createComponent(ReservationSenderProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads sender profile information and displays the description', () => {
    createComponent();

    expect(component.booking?.id).toBe(7);
    expect(component.senderProfile?.completedTripCount).toBe(3);
    expect(component.senderProfile?.sentPackageCount).toBe(11);
    expect(fixture.nativeElement.textContent).toContain('Grace Hopper');
    expect(fixture.nativeElement.textContent).toContain('Description');
    expect(fixture.nativeElement.textContent).toContain('Dossier important');
    expect(fixture.nativeElement.textContent).toContain('Marc Bernard');
  });

  it('starts a conversation with the sender', () => {
    createComponent();

    component.messageSender();

    expect(messagingServiceMock.startConversation).toHaveBeenCalledWith({
      tripId: 12,
      recipientId: 55,
      content: 'Bonjour, je vous contacte au sujet de votre réservation "Documents" pour mon trajet Paris, France vers Abidjan, Côte d\'Ivoire.',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages']);
  });

  it('shows an error state when booking cannot be found', () => {
    tripServiceMock.getTripBookings.and.returnValue(of([buildBooking({ id: 99 })]));

    createComponent();

    expect(component.booking).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Impossible de retrouver ce profil pour cette réservation.');
  });

  it('shows an error state when profile request fails', () => {
    tripServiceMock.getTripById.and.returnValue(throwError(() => new Error('boom')));
    tripServiceMock.getTripBookings.and.returnValue(throwError(() => new Error('boom')));
    tripServiceMock.getBookingSenderProfile.and.returnValue(throwError(() => new Error('boom')));

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger ce profil utilisateur.');
  });

  it('shows a message when the sender has no reviews', () => {
    tripServiceMock.getBookingSenderProfile.and.returnValue(of(buildSenderProfile({
      averageRating: null,
      reviewCount: 0,
      reviews: [],
    })));

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Aucun avis pour le moment.');
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
    senderRatingAverage: 4.8,
    senderRatingCount: 24,
    title: 'Documents',
    weight: 2,
    description: 'Dossier important',
    recipientContact: '+22501020304',
    status: 'PENDING',
    validationCodeActive: false,
    ...overrides,
  };
}

function buildSenderProfile(overrides: Partial<BookingSenderProfileResponse> = {}): BookingSenderProfileResponse {
  return {
    completedTripCount: 3,
    sentPackageCount: 11,
    averageRating: 4.8,
    reviewCount: 2,
    reviews: [
      {
        reviewerName: 'Marc Bernard',
        rating: 5,
        comment: 'Tres fiable',
        submittedAt: '2025-03-12T10:00:00',
      },
      {
        reviewerName: 'Alice Leroy',
        rating: 4,
        comment: 'Bonne communication',
        submittedAt: '2025-02-28T10:00:00',
      },
    ],
    ...overrides,
  };
}
