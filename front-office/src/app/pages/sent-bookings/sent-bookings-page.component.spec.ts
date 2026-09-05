import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { MessagingService } from '../../services/messaging.service';
import { SentBookingsPageComponent } from './sent-bookings-page.component';

describe('SentBookingsPageComponent', () => {
  let fixture: ComponentFixture<SentBookingsPageComponent>;
  let component: SentBookingsPageComponent;
  let router: Router;

  const bookingFixtures = [
    {
      id: 10,
      tripId: 50,
      tripDestination: 'Abidjan',
      travelerId: 9,
      senderId: 1,
      senderName: 'Ada Lovelace',
      title: 'Documents',
      weight: 1,
      recipientContact: 'alice@example.com',
      status: 'PENDING' as const,
      validationCodeActive: false,
      createdAt: '2025-06-10T09:30:00Z',
    },
    {
      id: 11,
      tripId: 51,
      tripDestination: 'Dakar',
      travelerId: 10,
      senderId: 1,
      senderName: 'Ada Lovelace',
      title: 'Vetements',
      weight: 3,
      recipientContact: '+33 6 00 00 00 00',
      status: 'REJECTED' as const,
      validationCodeActive: false,
      createdAt: '2025-06-08T09:30:00Z',
    },
  ];

  let authServiceMock: jasmine.SpyObj<AuthService>;
  let tripServiceMock: jasmine.SpyObj<TripService>;
  let messagingServiceMock: jasmine.SpyObj<MessagingService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    authServiceMock.isLoggedIn.and.returnValue(true);

    tripServiceMock = jasmine.createSpyObj('TripService', ['getMyBookings', 'cancelBooking']);
    messagingServiceMock = jasmine.createSpyObj('MessagingService', ['createConversationDraft']);
    tripServiceMock.getMyBookings.and.returnValue(of(bookingFixtures));
    tripServiceMock.cancelBooking.and.returnValue(of({ ...bookingFixtures[0], status: 'CANCELLED' as const }));
    messagingServiceMock.createConversationDraft.and.returnValue(of({
      id: 99, tripId: 50, tripRoute: 'Paris → Abidjan', otherParticipantId: 9,
      otherParticipantName: 'Voyageur', lastMessage: null, unreadCount: 0, createdAt: '2026-08-19T21:58:00',
    }));

    await TestBed.configureTestingModule({
      imports: [SentBookingsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: TripService, useValue: tripServiceMock },
        { provide: MessagingService, useValue: messagingServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(SentBookingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('redirects to login when not authenticated', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);

    const unauthenticatedFixture = TestBed.createComponent(SentBookingsPageComponent);
    unauthenticatedFixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('loads sent bookings on init sorted by most recent first', () => {
    expect(tripServiceMock.getMyBookings).toHaveBeenCalled();
    expect(component.myBookings.map((booking) => booking.id)).toEqual([10, 11]);
  });

  it('renders the empty state when there are no bookings', () => {
    tripServiceMock.getMyBookings.and.returnValue(of([]));

    const emptyFixture = TestBed.createComponent(SentBookingsPageComponent);
    emptyFixture.detectChanges();

    expect(emptyFixture.nativeElement.textContent).toContain("Vous n'avez envoye aucune demande pour le moment.");
  });

  it('renders status labels and only exposes cancel for cancellable bookings', () => {
    const text = fixture.nativeElement.textContent ?? '';
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const cancelButtons = buttons.filter((button) => button.textContent?.includes('Annuler'));

    expect(text).toContain('En attente');
    expect(text).toContain('Refusee');
    expect(cancelButtons.length).toBe(1);
  });

  it('renders the compact booking card with trip and recipient details', () => {
    const card = fixture.nativeElement.querySelector('article') as HTMLElement;

    expect(card.textContent).toContain('Destination & trajet');
    expect(card.textContent).toContain('Abidjan');
    expect(card.textContent).toContain('Trajet #50');
    expect(card.classList).toContain('max-w-[29rem]');
  });

  it('navigates to the sent booking detail when clicking a card', () => {
    const cards = fixture.nativeElement.querySelectorAll('article');

    cards[0].click();

    expect(router.navigate).toHaveBeenCalledWith(['/sent-bookings', 50, 10]);
  });

  it('navigates to the sent booking detail with Enter and Space', () => {
    const card = fixture.nativeElement.querySelector('article') as HTMLElement;

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

    expect(router.navigate).toHaveBeenCalledTimes(2);
    expect(router.navigate).toHaveBeenCalledWith(['/sent-bookings', 50, 10]);
  });

  it('does not navigate when clicking the cancel button', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const cancelButton = (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[])
      .find((button) => button.textContent?.includes('Annuler')) as HTMLButtonElement;

    cancelButton.click();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('starts a conversation with the booking traveler without opening the detail', () => {
    component.messageTraveler(component.myBookings[0]);

    expect(messagingServiceMock.createConversationDraft).toHaveBeenCalledWith({ tripId: 50, recipientId: 9 });
    expect(router.navigate).toHaveBeenCalledWith(['/messages'], { queryParams: { conversationId: 99 } });
  });

  it('exposes a phone link only for a phone recipient', () => {
    expect(component.phoneHref('alice@example.com')).toBeNull();
    expect(component.phoneHref('+33 6 00 00 00 00')).toBe('tel:+33600000000');
    expect(fixture.nativeElement.querySelectorAll('a[href^="tel:"]').length).toBe(1);
  });

  it('copies the recipient contact without navigating', async () => {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    component.copyRecipientContact(component.myBookings[0]);
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith('alice@example.com');
    expect(component.copiedBookingId).toBe(10);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('cancels a booking and updates it locally', () => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.cancelBooking(component.myBookings[0]);

    expect(tripServiceMock.cancelBooking).toHaveBeenCalledWith(50, 10);
    expect(component.myBookings[0].status).toBe('CANCELLED');
  });

  it('shows an error when loading bookings fails', () => {
    tripServiceMock.getMyBookings.and.returnValue(throwError(() => new Error('boom')));

    const failingFixture = TestBed.createComponent(SentBookingsPageComponent);
    failingFixture.detectChanges();

    expect(failingFixture.nativeElement.textContent).toContain('Impossible de charger vos demandes envoyees pour le moment.');
  });

  it('shows an error when cancellation fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    tripServiceMock.cancelBooking.and.returnValue(throwError(() => new Error('boom')));

    component.cancelBooking(component.myBookings[0]);

    expect(component.actionError).toBe("Impossible d'annuler cette demande pour le moment.");
    expect(component.cancellingBookingId).toBeNull();
  });
});
