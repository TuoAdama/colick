import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { UserResponse } from '../../models/auth.model';
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

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
    getUser: jasmine.createSpy('getUser').and.callFake(() => currentUser$.getValue()),
    currentUser$,
    uploadPhoto: jasmine.createSpy('uploadPhoto').and.returnValue(of(currentUser$.getValue())),
    updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of(currentUser$.getValue())),
    requestEmailChange: jasmine.createSpy('requestEmailChange').and.returnValue(of(void 0)),
    changePassword: jasmine.createSpy('changePassword').and.returnValue(of(currentUser$.getValue())),
  };

  const tripServiceMock = {
    getMyTrips: jasmine.createSpy('getMyTrips').and.returnValue(of([])),
    getTripBookings: jasmine.createSpy('getTripBookings').and.returnValue(of([])),
    getMyBookings: jasmine.createSpy('getMyBookings').and.returnValue(of([])),
    completeTrip: jasmine.createSpy('completeTrip').and.returnValue(of()),
    cancelTrip: jasmine.createSpy('cancelTrip').and.returnValue(of(void 0)),
    acceptBooking: jasmine.createSpy('acceptBooking').and.returnValue(of()),
    rejectBooking: jasmine.createSpy('rejectBooking').and.returnValue(of()),
    removeBooking: jasmine.createSpy('removeBooking').and.returnValue(of(void 0)),
    cancelBooking: jasmine.createSpy('cancelBooking').and.returnValue(of()),
    confirmBookingDelivery: jasmine.createSpy('confirmBookingDelivery').and.returnValue(of()),
  };

  beforeEach(async () => {
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

  it('shows propose-trip CTAs in the received reservations tab when no trip exists', () => {
    component.activeTab = 'received';
    component.myTrips = [];
    component.isLoadingTrips = false;

    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const proposeLinks = Array.from(links)
      .filter((link) => (link.textContent ?? '').includes('Proposer un voyage'));

    expect(proposeLinks.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain("Vous n'avez aucun trajet proposé pour le moment.");
    expect(proposeLinks.every((link) => link.getAttribute('href') === '/propose')).toBeTrue();
    expect(proposeLinks.every((link) => link.className.includes('bg-secondary'))).toBeTrue();
  });

  it('shows identity reminder and hides password form for Google-only accounts', () => {
    currentUser$.next({
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'USER',
      identityDocument: '',
      hasPassword: false,
    });

    fixture.detectChanges();

    expect(component.needsIdentityDocument()).toBeTrue();
    expect(component.hasLocalPassword()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Ajoutez votre pièce d\'identité');
    expect(fixture.nativeElement.textContent).toContain('Mot de passe oublie');
  });

  it('shows an edit action for active trips and opens the edit route', () => {
    component.activeTab = 'received';
    component.myTrips = [
      {
        id: 12,
        travelerId: 1,
        travelerName: 'Ada',
        departureAddress: 'Paris, France',
        destination: "Abidjan, Côte d'Ivoire",
        departureTime: '2025-05-10T08:00:00',
        arrivalTime: '2025-05-10T16:00:00',
        maxWeight: 20,
        pricePerKilo: 15,
        instantAcceptance: true,
        status: 'ACTIVE',
        availableWeight: 8,
      },
      {
        id: 13,
        travelerId: 1,
        travelerName: 'Ada',
        departureAddress: 'Lyon, France',
        destination: 'Dakar, Sénégal',
        departureTime: '2025-06-10T08:00:00',
        arrivalTime: '2025-06-10T16:00:00',
        maxWeight: 10,
        pricePerKilo: 9,
        instantAcceptance: false,
        status: 'COMPLETED',
        availableWeight: 0,
      },
    ];
    component.tripBookingsMap = { 12: [], 13: [] };

    fixture.detectChanges();

    const editButtons = Array.from(
      fixture.nativeElement.querySelectorAll('button[aria-label="Modifier ce trajet"]')
    ) as HTMLButtonElement[];

    expect(editButtons.length).toBe(1);

    editButtons[0].click();

    expect(router.navigate).toHaveBeenCalledWith(['/propose', 12]);
  });
});
