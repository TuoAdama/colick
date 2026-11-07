import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
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
  let clipboardDescriptor: PropertyDescriptor | undefined;

  function mockClipboard(clipboard: Partial<Clipboard> | undefined): void {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  }

  afterEach(() => {
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  const tripParamMap$ = new BehaviorSubject(convertToParamMap({ tripId: '12', bookingId: '7' }));

  const tripServiceMock = {
    getTripById: jasmine.createSpy('getTripById'),
    getTripBookingById: jasmine.createSpy('getTripBookingById'),
    acceptBooking: jasmine.createSpy('acceptBooking'),
    rejectBooking: jasmine.createSpy('rejectBooking'),
    removeBooking: jasmine.createSpy('removeBooking'),
    confirmBookingDelivery: jasmine.createSpy('confirmBookingDelivery'),
  };

  const messagingServiceMock = {
    startConversation: jasmine.createSpy('startConversation'),
    createConversationDraft: jasmine.createSpy('createConversationDraft'),
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
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    tripParamMap$.next(convertToParamMap({ tripId: '12', bookingId: '7' }));
    tripServiceMock.getTripById.calls.reset();
    tripServiceMock.getTripBookingById.calls.reset();
    tripServiceMock.acceptBooking.calls.reset();
    tripServiceMock.rejectBooking.calls.reset();
    tripServiceMock.removeBooking.calls.reset();
    tripServiceMock.confirmBookingDelivery.calls.reset();
    messagingServiceMock.startConversation.calls.reset();
    messagingServiceMock.createConversationDraft.calls.reset();
    authServiceMock.getUser.calls.reset();
    authServiceMock.logout.calls.reset();

    tripServiceMock.getTripById.and.returnValue(of(buildTrip()));
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking()));
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
    messagingServiceMock.createConversationDraft.and.returnValue(of({
      id: 1,
      tripId: 12,
      tripRoute: 'Paris → Abidjan',
      otherParticipantId: 55,
      otherParticipantName: 'Grace Hopper',
      lastMessage: null,
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
    expect(fixture.nativeElement.textContent).toContain('4,8');
    expect(fixture.nativeElement.textContent).toContain('(24 avis)');
    expect(fixture.nativeElement.textContent).toContain('Montant convenu');
    expect(fixture.nativeElement.textContent).toContain('Frais Coliclic');
    expect(fixture.nativeElement.textContent).toContain('Montant pour le voyageur');
    expect(component.platformCommission()).toBe(0);
    expect(component.netAmount()).toBe(30);
  });

  it('renders the vertical itinerary with cities, countries and the departure date', () => {
    createComponent();
    const stops = fixture.nativeElement.querySelectorAll('.journey-stop');
    expect(stops.length).toBe(2);
    expect(stops[0].querySelector('.journey-city').textContent).toContain('Paris');
    expect(stops[0].querySelector('.journey-country').textContent).toContain('France');
    expect(stops[1].querySelector('.journey-city').textContent).toContain('Abidjan');
    expect(stops[1].querySelector('.journey-country').textContent).toContain("Côte d'Ivoire");
    expect(fixture.nativeElement.querySelector('.journey-date').textContent).toContain('08:00');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Paris vers Abidjan');
  });

  it('hides countries when addresses contain only a city', () => {
    tripServiceMock.getTripById.and.returnValue(of({ ...buildTrip(), departureAddress: 'Paris', destination: 'Abidjan' }));
    createComponent();
    expect(fixture.nativeElement.querySelectorAll('.journey-country').length).toBe(0);
    expect(component.countryName(' Paris, Île-de-France, France ')).toBe('France');
  });

  it('renders the package and financial summary with the real booking values', () => {
    createComponent();
    const page = fixture.nativeElement;
    expect(page.querySelector('.package-title').textContent).toContain('Documents');
    expect(page.querySelector('.weight-badge').textContent).toContain('2 kg');
    expect(page.querySelector('.contact-value').textContent).toContain('+22501020304');
    expect(page.querySelector('.package-description').textContent).toContain('Dossier important');
    expect(page.querySelector('.financial-total').textContent).toContain('Montant pour le voyageur');
    expect(page.querySelector('.financial-total strong').textContent).toContain('30 €');
    expect(page.querySelector('.settlement-note').textContent).toContain('Règlement direct entre utilisateurs');
  });

  it('keeps long values and the missing-description fallback available', () => {
    const longValue = 'Longue information sans troncature '.repeat(8);
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking({ title: longValue, senderName: longValue, recipientContact: longValue, description: undefined })));
    createComponent();
    expect(fixture.nativeElement.querySelector('.package-title').textContent).toContain(longValue);
    expect(fixture.nativeElement.querySelector('.contact-value').textContent).toContain(longValue);
    expect(fixture.nativeElement.querySelector('.sender-name').textContent).toContain(longValue);
    expect(fixture.nativeElement.querySelector('.package-description').textContent).toContain('Aucune description fournie.');
  });

  it('copies the recipient contact from the button and announces success', async () => {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    mockClipboard({ writeText });
    createComponent();
    fixture.nativeElement.querySelector('.copy-contact').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledOnceWith('+22501020304');
    const feedback = fixture.nativeElement.querySelector('[role="status"]');
    expect(feedback.textContent).toContain('Contact copié');
    expect(feedback.getAttribute('aria-live')).toBe('polite');
  });

  it('shows a local error when clipboard permission is denied', async () => {
    const writeText = jasmine.createSpy('writeText').and.rejectWith(new Error('Denied'));
    mockClipboard({ writeText });
    createComponent();
    await component.copyRecipientContact();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.copy-feedback').textContent).toContain('Copie impossible');
    expect(component.actionError).toBe('');
    expect(component.isCopyingContact).toBeFalse();
  });

  it('handles browsers without a clipboard API', async () => {
    mockClipboard(undefined);
    createComponent();
    await component.copyRecipientContact();
    expect(component.contactCopyFailed).toBeTrue();
    expect(component.contactCopyFeedback).toContain('Sélectionnez le contact');
  });

  it('retains the optional package photo and falls back to the initial for a broken sender photo', () => {
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking({ packagePhotoUrl: '/parcel.jpg', senderPhotoUrl: '/sender.jpg' })));
    createComponent();
    const photo = fixture.nativeElement.querySelector('img[alt="Photo du colis Documents"]');
    expect(photo.getAttribute('src')).toBe('/parcel.jpg');
    fixture.nativeElement.querySelector('.sender-card img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sender-card img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sender-card').textContent).toContain('G');
  });

  it('opens messages from the visible Message button', () => {
    createComponent();
    fixture.nativeElement.querySelector('.message-button').click();
    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({ tripId: 12, recipientId: 55 });
  });

  it('refuses a pending booking from the action button', () => {
    createComponent();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Refuser la demande'))!.click();
    fixture.detectChanges();
    expect(tripServiceMock.rejectBooking).toHaveBeenCalledWith(12, 7);
    expect(component.booking?.status).toBe('REJECTED');
    expect(fixture.nativeElement.textContent).toContain('lecture seule');
  });

  it('provides a link to the sender profile page', () => {
    createComponent();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    const profileLink = links.find((link) => link.textContent?.includes('Voir le profil') ?? false);

    expect(profileLink).toBeDefined();
    expect(profileLink?.getAttribute('href')).toContain('/trips/12/reservations/7/profile');
  });

  it('uses the booking fee snapshot after the global mode changes', () => {
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking({
      commercialMode: 'COMMISSION',
      platformFeeRate: 0.07,
    })));

    createComponent();

    expect(component.platformCommission()).toBeCloseTo(2.1, 5);
    expect(component.netAmount()).toBeCloseTo(27.9, 5);
    expect(component.bookingFeeLabel()).toContain('7');
    expect(component.bookingGrossLabel()).toBe('Prix total payé');
    expect(component.bookingNetLabel()).toBe('Votre gain net');
    expect(fixture.nativeElement.querySelector('.settlement-note')).toBeNull();
    expect(fixture.nativeElement.querySelector('.financial-total').textContent).toMatch(/27[.,]9 €/);
  });

  it('does not show direct settlement for a commission booking with a zero fee', () => {
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking({ commercialMode: 'COMMISSION', platformFeeRate: 0 })));
    createComponent();
    expect(fixture.nativeElement.querySelector('.settlement-note')).toBeNull();
  });

  it('displays zero reviews when the sender has no reviews', () => {
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking({
      senderRatingAverage: null,
      senderRatingCount: 0,
    })));

    createComponent();

    expect(fixture.nativeElement.textContent).toContain('(0)');
    expect(fixture.nativeElement.textContent).not.toContain('Aucun avis pour le moment');
  });

  it('redirects to 404 when the targeted booking cannot be found', () => {
    tripServiceMock.getTripBookingById.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    createComponent();

    expect(component.booking).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/404']);
  });

  it('starts a conversation with the sender and navigates to messages', () => {
    createComponent();

    component.messageSender();

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({
      tripId: 12,
      recipientId: 55,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], { queryParams: { conversationId: 1 } });
  });

  it('accepts the booking and updates the page state', () => {
    createComponent();

    component.acceptBooking();

    expect(tripServiceMock.acceptBooking).toHaveBeenCalledWith(12, 7);
    expect(component.booking?.status).toBe('ACCEPTED');
  });

  it('confirms the booking delivery with the entered code', () => {
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking({
      status: 'ACCEPTED',
      validationCodeActive: true,
    })));

    createComponent();
    component.deliveryCode = '123456';

    component.confirmBookingDelivery();

    expect(tripServiceMock.confirmBookingDelivery).toHaveBeenCalledWith(12, 7, {
      validationCode: '123456',
    });
    expect(component.booking?.deliveredAt).toBe('2025-07-15T10:00:00');
  });

  it('removes the booking and navigates back to the reservations list', () => {
    tripServiceMock.getTripBookingById.and.returnValue(of(buildBooking({
      status: 'ACCEPTED',
    })));

    createComponent();
    component.openRemoveBookingModal();
    component.confirmRemoveBooking();

    expect(tripServiceMock.removeBooking).toHaveBeenCalledWith(12, 7);
    expect(router.navigate).toHaveBeenCalledWith(['/trips', 12, 'reservations']);
  });

  it('shows an error state when the booking detail request fails', () => {
    tripServiceMock.getTripById.and.returnValue(throwError(() => new Error('boom')));
    tripServiceMock.getTripBookingById.and.returnValue(throwError(() => new Error('boom')));

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
