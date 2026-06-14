import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { SentBookingsPageComponent } from './sent-bookings-page.component';

describe('SentBookingsPageComponent', () => {
  let fixture: ComponentFixture<SentBookingsPageComponent>;
  let component: SentBookingsPageComponent;
  let router: Router;

  const bookingFixtures = [
    {
      id: 10,
      tripId: 50,
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

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    authServiceMock.isLoggedIn.and.returnValue(true);

    tripServiceMock = jasmine.createSpyObj('TripService', ['getMyBookings', 'cancelBooking']);
    tripServiceMock.getMyBookings.and.returnValue(of(bookingFixtures));
    tripServiceMock.cancelBooking.and.returnValue(of({ ...bookingFixtures[0], status: 'CANCELLED' as const }));

    await TestBed.configureTestingModule({
      imports: [SentBookingsPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: TripService, useValue: tripServiceMock },
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
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(text).toContain('En attente');
    expect(text).toContain('Refusee');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain('Annuler');
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
