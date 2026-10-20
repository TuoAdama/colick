import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { MessagingService } from '../../services/messaging.service';
import { BookingResponse, SentBookingResponse } from '../../models/booking.model';
import { SentBookingsPageComponent } from './sent-bookings-page.component';
import { SentBookingDetailPageComponent } from '../sent-booking-detail/sent-booking-detail-page.component';

const bookings: SentBookingResponse[] = [
  { id: 10, tripId: 50, tripDepartureAddress: 'Paris, France', tripDestination: "Abidjan, Côte d’Ivoire", travelerId: 9,
    senderId: 1, senderName: 'Ada', title: 'Documents', weight: 1, recipientContact: 'alice@example.com',
    status: 'PENDING', validationCodeActive: false, createdAt: '2026-06-10T09:30:00Z' },
  { id: 11, tripId: 51, tripDepartureAddress: 'Lyon', tripDestination: 'Dakar', travelerId: 10,
    senderId: 1, senderName: 'Ada', title: 'Vêtements', weight: 3, recipientContact: '+33600000000',
    status: 'REJECTED', validationCodeActive: false, createdAt: '2026-06-08T09:30:00Z' },
];

describe('SentBookingsPageComponent', () => {
  let fixture: ComponentFixture<SentBookingsPageComponent>;
  let service: jasmine.SpyObj<TripService>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    auth.isLoggedIn.and.returnValue(true);
    service = jasmine.createSpyObj('TripService', ['getMyBookings']);
    service.getMyBookings.and.returnValue(of([...bookings].reverse()));
    await TestBed.configureTestingModule({
      imports: [SentBookingsPageComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: TripService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(SentBookingsPageComponent);
    fixture.detectChanges();
  });

  it('loads real requests newest first without changing the source array', () => {
    expect(service.getMyBookings).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.myBookings.map(b => b.id)).toEqual([10, 11]);
  });

  it('renders only route, parcel, weight, status and a native detail link per request', () => {
    const links = fixture.nativeElement.querySelectorAll('.booking-card') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/sent-bookings/50/10');
    expect(links[0].textContent).toContain('Paris → Abidjan');
    expect(links[0].textContent).toContain('Documents · 1 kg');
    expect(links[0].textContent).toContain('En attente');
    expect(links[1].textContent).toContain('Refusée');
    expect(links[0].getAttribute('aria-label')).toContain('Paris, France');
    expect(links[0].querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('alice@example.com');
    expect(text).not.toContain('TRK-');
    expect(text).not.toContain('2026');
    expect(text).not.toContain('Message');
    expect(text).not.toContain('Annuler');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('shows the count and a search link', () => {
    expect(fixture.nativeElement.textContent).toContain('2 demandes');
    expect(fixture.nativeElement.querySelector('a[href="/search"]')).not.toBeNull();
    service.getMyBookings.and.returnValue(of([bookings[0]]));
    fixture.componentInstance.loadMyBookings();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 demande');
    expect(fixture.nativeElement.textContent).not.toContain('1 demandes');
  });

  it('renders every supported status with accents', () => {
    const statuses: BookingResponse['status'][] = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'REMOVED'];
    service.getMyBookings.and.returnValue(of(statuses.map((status, id) => ({ ...bookings[0], id, status }))));
    fixture.componentInstance.loadMyBookings();
    fixture.detectChanges();
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.booking-status') as NodeListOf<HTMLElement>).map(el => el.textContent?.trim());
    expect(labels).toEqual(['En attente', 'Acceptée', 'Refusée', 'Annulée', 'Retirée']);
  });

  it('renders empty, loading and failure states without a misleading empty state', () => {
    const pending = new Subject<SentBookingResponse[]>();
    service.getMyBookings.and.returnValue(pending);
    fixture.componentInstance.loadMyBookings();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Chargement');
    pending.next([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Vous n'avez envoyé aucune demande");
    service.getMyBookings.and.returnValue(throwError(() => new Error('offline')));
    fixture.componentInstance.loadMyBookings();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Impossible de charger');
    expect(fixture.nativeElement.textContent).not.toContain("Vous n'avez envoyé");
  });

  it('redirects an unauthenticated visitor', () => {
    auth.isLoggedIn.and.returnValue(false);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    TestBed.createComponent(SentBookingsPageComponent).detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('Sent booking navigation', () => {
  it('opens a real detail route from the native link and returns to the list', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'sent-bookings', component: SentBookingsPageComponent },
          { path: 'sent-bookings/:tripId/:bookingId', component: SentBookingDetailPageComponent },
        ]),
        { provide: AuthService, useValue: { isLoggedIn: () => true } },
        { provide: TripService, useValue: {
          getMyBookings: () => of(bookings),
          getTripById: () => of({ id: 50, travelerId: 9, travelerName: 'Voyageur', departureAddress: 'Paris, France', destination: 'Abidjan', pricePerKilo: 10 }),
          getMyTripBookingById: () => of(bookings[0]),
        } },
        { provide: MessagingService, useValue: {} },
      ],
    }).compileComponents();
    const harness = await RouterTestingHarness.create('/sent-bookings');
    const link = harness.routeNativeElement!.querySelector('.booking-card') as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    link.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/sent-bookings/50/10');
    expect(harness.routeNativeElement!.querySelector('h1')!.textContent).toContain('Documents');
    (harness.routeNativeElement!.querySelector('a[href="/sent-bookings"]') as HTMLAnchorElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/sent-bookings');
    expect(harness.routeNativeElement!.querySelectorAll('.booking-card').length).toBe(2);
  });
});
