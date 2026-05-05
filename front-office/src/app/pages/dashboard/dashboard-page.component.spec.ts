import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { UserResponse } from '../../models/auth.model';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { ShareCardMapperService } from '../../services/share-card-mapper.service';
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

  const shareCardMapperServiceMock = {
    mapActiveTripToShareCard: jasmine.createSpy('mapActiveTripToShareCard').and.returnValue({
      city: 'Abidjan',
      country: "Côte d'Ivoire",
      formattedDate: '14 juillet 2025',
      phone: '+33 6 00 00 00 00',
      email: 'ada@example.com',
      availableWeightLabel: '8 kg',
      pricePerKiloLabel: '10,00 € / kg',
    }),
    buildFileDate: jasmine.createSpy('buildFileDate').and.returnValue('2025-07-14'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ShareCardMapperService, useValue: shareCardMapperServiceMock },
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

  it('shows an identity proof file field in the profile tab', () => {
    component.activeTab = 'profile';
    fixture.detectChanges();

    const fileInput = fixture.nativeElement.querySelector('#identityProofFile') as HTMLInputElement | null;

    expect(fileInput).not.toBeNull();
    expect(fileInput?.type).toBe('file');
    expect(fixture.nativeElement.textContent).toContain('Justificatif (fichier)');
  });

  it('downloads a PNG share card from the selected active trip', async () => {
    const selectedTrip = buildTrip();
    component.activeTab = 'received';
    component.myTrips = [selectedTrip];
    component.tripBookingsMap = { [selectedTrip.id]: [] };
    component.selectedTripId = selectedTrip.id;
    fixture.detectChanges();

    const requestAnimationFrameSpy = spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    const generatePngSpy = spyOn<any>(component, 'generatePngFromElement').and.resolveTo('data:image/png;base64,test');

    const anchor = document.createElement('a');
    const anchorClickSpy = spyOn(anchor, 'click');
    const originalCreateElement = document.createElement.bind(document);
    spyOn(document, 'createElement').and.callFake((tagName: string) => (
      tagName.toLowerCase() === 'a' ? anchor : originalCreateElement(tagName)
    ));

    await component.downloadShareCardPng();

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(shareCardMapperServiceMock.mapActiveTripToShareCard).toHaveBeenCalledWith(selectedTrip, currentUser$.getValue());
    expect(generatePngSpy).toHaveBeenCalled();
    expect(anchor.download).toBe('colick-carte-partage-2025-07-14.png');
    expect(anchorClickSpy).toHaveBeenCalled();
    expect(component.shareCardError).toBe('');
  });
});

function buildTrip(): Trip {
  return {
    id: 12,
    travelerId: 1,
    travelerName: 'Ada',
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
