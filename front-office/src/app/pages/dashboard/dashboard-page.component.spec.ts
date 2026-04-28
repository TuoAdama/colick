import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { UserResponse } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;

  const currentUser$ = new BehaviorSubject<UserResponse>({
    id: 1,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'USER',
    phone: '+33 6 00 00 00 00',
    identityDocument: 'AA123456',
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
});