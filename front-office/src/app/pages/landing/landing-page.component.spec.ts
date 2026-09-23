import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { TripService } from '../../services/trip.service';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let fixture: ComponentFixture<LandingPageComponent>;
  let component: LandingPageComponent;
  let router: Router;
  let geolocationMock: {
    getCurrentPosition: jasmine.Spy;
  };

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
  };

  const locationServiceMock = {
    searchLocations: jasmine.createSpy('searchLocations').and.returnValue(of([])),
  };

  const tripServiceMock = {
    getLandingFeed: jasmine.createSpy('getLandingFeed').and.returnValue(of([])),
  };

  function installGeolocationMock(): void {
    geolocationMock = {
      getCurrentPosition: jasmine.createSpy('getCurrentPosition'),
    };
    geolocationMock.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success({
        coords: { latitude: 48.8566, longitude: 2.3522, accuracy: 10 },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: geolocationMock,
    });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
        { provide: TripService, useValue: tripServiceMock },
      ],
    }).compileComponents();

    installGeolocationMock();
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    authServiceMock.isLoggedIn.and.returnValue(true);
    tripServiceMock.getLandingFeed.calls.reset();
    tripServiceMock.getLandingFeed.and.returnValue(of([]));
  });

  it('shows a transport search form with route and desired date fields', () => {
    fixture.detectChanges();

    component.selectMode('transport');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Date souhaitee');
    expect(fixture.nativeElement.textContent).toContain('Voir les demandes');
    expect(fixture.nativeElement.textContent).toContain('Publier un trajet');
  });

  it('marks departure and destination as required in both landing search forms', () => {
    fixture.detectChanges();

    const sendFormInputs = Array.from(fixture.nativeElement.querySelectorAll('form input')) as HTMLInputElement[];
    expect(sendFormInputs.find((input) => input.name === 'departure')?.required).toBeTrue();
    expect(sendFormInputs.find((input) => input.name === 'departure')?.getAttribute('aria-required')).toBe('true');
    expect(sendFormInputs.find((input) => input.name === 'destination')?.required).toBeTrue();
    expect(sendFormInputs.find((input) => input.name === 'destination')?.getAttribute('aria-required')).toBe('true');

    component.selectMode('transport');
    fixture.detectChanges();

    const transportFormInputs = Array.from(fixture.nativeElement.querySelectorAll('form input')) as HTMLInputElement[];
    expect(transportFormInputs.find((input) => input.name === 'transportDeparture')?.required).toBeTrue();
    expect(transportFormInputs.find((input) => input.name === 'transportDestination')?.required).toBeTrue();
  });

  it('does not navigate when departure or destination is missing', () => {
    fixture.detectChanges();

    component.searchTrips();
    expect(router.navigate).not.toHaveBeenCalled();

    component.departureQuery = 'Paris';
    component.searchTrips();
    expect(router.navigate).not.toHaveBeenCalled();

    component.destinationQuery = 'Abidjan';
    component.searchTrips();
    expect(router.navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: { from: 'Paris', to: 'Abidjan' },
    });
  });

  it('does not navigate to parcel search when departure or destination is missing', () => {
    fixture.detectChanges();
    component.selectMode('transport');
    (router.navigate as jasmine.Spy).calls.reset();

    component.searchParcelRequests();
    expect(router.navigate).not.toHaveBeenCalled();

    component.departureQuery = 'Paris';
    component.searchParcelRequests();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('uses clear sender and traveler labels for the landing mode selector', () => {
    fixture.detectChanges();

    const modeButtons = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .slice(0, 2) as HTMLButtonElement[];

    expect(modeButtons.map((button) => button.textContent?.trim())).toEqual([
      'Je veux envoyer',
      'Je voyage',
    ]);
  });

  it('updates the URL query param when switching tabs', () => {
    fixture.detectChanges();

    component.selectMode('transport');

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: jasmine.anything(),
      queryParams: { mode: 'transport' },
      queryParamsHandling: 'merge',
    });
  });

  it('reads the active tab from the URL query param on init', async () => {
    await router.navigateByUrl('/?mode=transport');

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.activeMode).toBe('transport');
  });

  it('navigates to the dedicated parcel search page with query params', () => {
    fixture.detectChanges();
    component.selectMode('transport');
    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.travelDate = '2026-07-01';

    component.searchParcelRequests();

    expect(router.navigate).toHaveBeenCalledWith(['/parcel-search'], {
      queryParams: {
        from: 'Paris',
        to: 'Abidjan',
        date: '2026-07-01',
      },
    });
  });

  it('does not render parcel request results on the landing page', () => {
    fixture.detectChanges();
    component.selectMode('transport');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Demande colis');
    expect(fixture.nativeElement.textContent).not.toContain('Aucune demande trouvee.');
  });

  it('links a landing trip card to its public reference page', () => {
    fixture.detectChanges();
    component.trips = [buildLandingTripCard({ reference: 'TRP-2026-000013' })];
    component.isTripsLoading = false;
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('[data-testid="landing-trip-card-link"]') as HTMLElement | null;
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/trips/ref/TRP-2026-000013');
    expect(link?.getAttribute('aria-label')).toBe('Voir le trajet de Paris, France vers Abidjan, Côte d\'Ivoire');
  });

  it('keeps the traveler profile link above the full-card trip overlay', () => {
    fixture.detectChanges();
    component.trips = [buildLandingTripCard({ reference: 'TRP-2026-000013' })];
    component.isTripsLoading = false;
    fixture.detectChanges();

    const travelerLink = fixture.nativeElement.querySelector('a[href="/travelers/7"]') as HTMLElement | null;
    expect(travelerLink).not.toBeNull();
    expect(travelerLink?.classList.contains('relative')).toBeTrue();
    expect(travelerLink?.classList.contains('z-20')).toBeTrue();
  });

  it('keeps a landing trip card visible without a link when its reference is missing', () => {
    fixture.detectChanges();
    component.trips = [buildLandingTripCard()];
    component.isTripsLoading = false;
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('article');
    expect(card?.textContent).toContain('Paris, France');
    expect(fixture.nativeElement.querySelector('[data-testid="landing-trip-card-link"]')).toBeNull();
  });

  it('hides the next departure section when location sharing is refused', () => {
    geolocationMock.getCurrentPosition.and.callFake((_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: 'Permission denied' } as GeolocationPositionError);
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Ne ratez pas le prochain depart.');
    expect(fixture.nativeElement.textContent).not.toContain('Voir tous les trajets');
    expect(tripServiceMock.getLandingFeed).not.toHaveBeenCalled();
  });

  it('shows the next departure section after location sharing is accepted', () => {
    geolocationMock.getCurrentPosition.and.callFake((success: PositionCallback) => {
      success({
        coords: { latitude: 48.8566, longitude: 2.3522, accuracy: 10 },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ne ratez pas le prochain depart.');
    expect(fixture.nativeElement.textContent).toContain('Voir tous les trajets');
    expect(tripServiceMock.getLandingFeed).toHaveBeenCalled();
    expect(tripServiceMock.getLandingFeed.calls.mostRecent().args[1]).toBe(3);
  });

  it('shows the next departure section when the position is temporarily unavailable', () => {
    geolocationMock.getCurrentPosition.and.callFake((_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 2, message: 'Position unavailable' } as GeolocationPositionError);
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ne ratez pas le prochain depart.');
    expect(tripServiceMock.getLandingFeed).toHaveBeenCalled();
  });
});

function buildLandingTripCard(overrides: { reference?: string } = {}) {
  return {
    id: 13,
    travelerId: 7,
    tag: 'Flash',
    price: '12€',
    departure: 'Paris, France',
    arrival: "Abidjan, Côte d'Ivoire",
    date: '14 juil. 2026',
    traveler: 'Alice Martin',
    rating: '4.8',
    capacity: '8kg libres',
    avatar: 'AM',
    avatarTone: 'bg-primary',
    ...overrides,
  };
}
