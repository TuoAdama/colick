import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { UserResponse } from '../../models/auth.model';
import { BookingResponse } from '../../models/booking.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let router: Router;

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

  const mockTrips: Trip[] = [
    {
      id: 10,
      travelerId: 1,
      travelerName: 'Ada Lovelace',
      departureAddress: 'Paris',
      destination: 'Lyon',
      departureTime: '2025-02-01T10:00:00',
      arrivalTime: '2025-02-01T14:00:00',
      maxWeight: 20,
      pricePerKilo: 5,
      instantAcceptance: false,
      status: 'ACTIVE',
      availableWeight: 15,
    },
    {
      id: 11,
      travelerId: 1,
      travelerName: 'Ada Lovelace',
      departureAddress: 'Lyon',
      destination: 'Marseille',
      departureTime: '2025-02-05T08:00:00',
      arrivalTime: '2025-02-05T12:00:00',
      maxWeight: 10,
      pricePerKilo: 8,
      instantAcceptance: true,
      status: 'COMPLETED',
      availableWeight: 0,
    },
  ];

  const mockReceivedBookings: BookingResponse[] = [
    {
      id: 100,
      tripId: 10,
      senderId: 2,
      senderName: 'Bob Martin',
      senderRatingAverage: 4.5,
      senderRatingCount: 10,
      title: 'Colis fragile',
      weight: 3,
      recipientContact: '+33 6 11 22 33 44',
      status: 'PENDING',
      validationCodeActive: false,
    },
    {
      id: 101,
      tripId: 10,
      senderId: 3,
      senderName: 'Claire Dupont',
      title: 'Documents',
      weight: 1,
      recipientContact: 'claire@example.com',
      status: 'ACCEPTED',
      validationCodeActive: true,
      validationDeliveryChannel: 'EMAIL',
      validationCodeSentAt: '2025-01-30T12:00:00',
    },
  ];

  const mockSentBookings: BookingResponse[] = [
    {
      id: 200,
      tripId: 20,
      senderId: 1,
      senderName: 'Ada Lovelace',
      title: 'Vêtements',
      weight: 5,
      description: 'Effets personnels pour le voyage',
      recipientContact: '+33 7 00 00 00 00',
      status: 'PENDING',
      validationCodeActive: false,
      createdAt: '2025-05-14T09:55:00',
    },
  ];

  let authServiceMock: any;
  let tripServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
      getUser: jasmine.createSpy('getUser').and.callFake(() => currentUser$.getValue()),
      currentUser$,
    };

    tripServiceMock = {
      getMyBookings: jasmine.createSpy('getMyBookings').and.returnValue(of(mockSentBookings)),
      getMyTrips: jasmine.createSpy('getMyTrips').and.returnValue(of(mockTrips)),
      getTripBookings: jasmine.createSpy('getTripBookings').and.returnValue(of(mockReceivedBookings)),
      cancelBooking: jasmine.createSpy('cancelBooking').and.returnValue(of({ ...mockSentBookings[0], status: 'CANCELLED' })),
      acceptBooking: jasmine.createSpy('acceptBooking').and.returnValue(of({ ...mockReceivedBookings[0], status: 'ACCEPTED' })),
      rejectBooking: jasmine.createSpy('rejectBooking').and.returnValue(of({ ...mockReceivedBookings[0], status: 'REJECTED' })),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: TripService, useValue: tripServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads sent bookings on init', () => {
    expect(tripServiceMock.getMyBookings).toHaveBeenCalled();
    expect(component.myBookings).toEqual(mockSentBookings);
  });

  it('renders sent bookings as cards matching the upcoming trips pattern', () => {
    const sentBookingCard = fixture.nativeElement.querySelector('article[role="link"]') as HTMLElement;

    expect(sentBookingCard.textContent).toContain('Vêtements');
    expect(sentBookingCard.textContent).toContain('5 kg');
    expect(sentBookingCard.textContent).toContain('+33 7 00 00 00 00');
    expect(sentBookingCard.textContent).toContain('Mai');
  });

  it('navigates to sent booking detail when clicking a sent booking card', () => {
    const sentBookingCard = fixture.nativeElement.querySelector('article[role="link"]') as HTMLElement;

    sentBookingCard.click();

    expect(router.navigate).toHaveBeenCalledWith(['/sent-bookings', 20, 200]);
  });

  it('cancels a sent booking without navigating to its detail', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const cancelButton = fixture.nativeElement.querySelector('article[role="link"] button') as HTMLButtonElement;

    cancelButton.click();

    expect(tripServiceMock.cancelBooking).toHaveBeenCalledWith(20, 200);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('loads my trips on init', () => {
    expect(tripServiceMock.getMyTrips).toHaveBeenCalled();
    expect(component.myTrips).toEqual(mockTrips);
  });

  it('loads received bookings after trips load', () => {
    expect(tripServiceMock.getTripBookings).toHaveBeenCalledWith(10);
    expect(component.receivedBookings).toEqual(mockReceivedBookings);
  });

  it('only loads received bookings for ACTIVE trips', () => {
    // Trip 11 is COMPLETED, so getTripBookings should only be called for trip 10
    expect(tripServiceMock.getTripBookings).toHaveBeenCalledTimes(1);
    expect(tripServiceMock.getTripBookings).toHaveBeenCalledWith(10);
  });

  it('computes activeTripsCount correctly', () => {
    expect(component.activeTripsCount).toBe(1);
  });

  it('computes pendingReceivedCount correctly', () => {
    expect(component.pendingReceivedCount).toBe(1);
  });

  it('computes totalEarnings from accepted bookings and trip pricePerKilo', () => {
    // Only booking 101 (ACCEPTED, weight=1) on trip 10 (pricePerKilo=5) → 1*5 = 5
    // Booking 100 is PENDING so excluded
    expect(component.totalEarnings).toBe(5);
  });

  it('displays empty state for sent bookings when empty', () => {
    tripServiceMock.getMyBookings.and.returnValue(of([]));
    const newFixture = TestBed.createComponent(DashboardPageComponent);
    newFixture.detectChanges();
    expect(newFixture.nativeElement.textContent).toContain("Vous n'avez envoyé aucune demande pour le moment.");
  });

  it('displays empty state for trips when empty', () => {
    tripServiceMock.getMyTrips.and.returnValue(of([]));
    const newFixture = TestBed.createComponent(DashboardPageComponent);
    newFixture.detectChanges();
    expect(newFixture.nativeElement.textContent).toContain("Vous n'avez aucun voyage planifié.");
  });

  it('displays empty state for received bookings when no active trips', () => {
    tripServiceMock.getMyTrips.and.returnValue(of([{ ...mockTrips[1] }])); // only COMPLETED
    tripServiceMock.getTripBookings.calls.reset();
    const newFixture = TestBed.createComponent(DashboardPageComponent);
    newFixture.detectChanges();
    const newComponent = newFixture.componentInstance;
    expect(newComponent.receivedBookings.length).toBe(0);
    expect(newFixture.nativeElement.textContent).toContain("Aucune demande reçue pour l'instant.");
  });

  it('acceptReceivedBooking calls service and updates list', () => {
    component.acceptReceivedBooking(mockReceivedBookings[0]);
    expect(tripServiceMock.acceptBooking).toHaveBeenCalledWith(10, 100);
    expect(component.receivedBookings[0].status).toBe('ACCEPTED');
  });

  it('rejectReceivedBooking calls service after confirm', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.rejectReceivedBooking(mockReceivedBookings[0]);
    expect(tripServiceMock.rejectBooking).toHaveBeenCalledWith(10, 100);
    expect(component.receivedBookings[0].status).toBe('REJECTED');
  });

  it('redirects to login when not authenticated', () => {
    authServiceMock.isLoggedIn.and.returnValue(false);
    const newFixture = TestBed.createComponent(DashboardPageComponent);
    newFixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('statusLabel returns correct labels', () => {
    expect(component.statusLabel('PENDING')).toBe('En attente');
    expect(component.statusLabel('ACCEPTED')).toBe('Acceptée');
    expect(component.statusLabel('REJECTED')).toBe('Refusée');
    expect(component.statusLabel('CANCELLED')).toBe('Annulée');
  });

  it('formatBookingDate returns a compact date block for createdAt', () => {
    expect(component.formatBookingDate('2025-05-14T09:55:00')).toEqual({ day: '14', month: 'Mai' });
  });

  it('getInitials returns correct initials', () => {
    expect(component.getInitials('Bob Martin')).toBe('BM');
    expect(component.getInitials('Claire')).toBe('C');
  });
});
