import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { Subject, of } from 'rxjs';
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
    getUser: jasmine.createSpy('getUser').and.returnValue(null),
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

    locationServiceMock.searchLocations.and.returnValue(of([]));
    installGeolocationMock();
    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue(null);
    tripServiceMock.getLandingFeed.calls.reset();
    tripServiceMock.getLandingFeed.and.returnValue(of([]));
  });

  it('shows a transport search form with route and desired date fields', () => {
    fixture.detectChanges();

    component.selectMode('transport');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Date souhaitée');
    expect(fixture.nativeElement.textContent).toContain('Voir les demandes');
    expect(fixture.nativeElement.textContent).toContain('Publier un trajet');
  });

  it('labels the trip search date as a lower bound', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const dateInput = host.querySelector<HTMLInputElement>('input[name="travelDate"]');
    expect(dateInput?.closest('label')?.textContent).toContain('À partir de');
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
    expect(transportFormInputs.find((input) => input.name === 'departure')?.required).toBeTrue();
    expect(transportFormInputs.find((input) => input.name === 'destination')?.required).toBeTrue();
  });

  it('swaps the route values and selected locations without changing the date in both modes', () => {
    const departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' as const };
    const destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' as const };
    component.departure = departure;
    component.destination = destination;
    component.departureQuery = 'Paris, France';
    component.destinationQuery = "Abidjan, Côte d'Ivoire";
    component.travelDate = '2026-10-15';
    component.departureSuggestions = [departure];
    component.destinationSuggestions = [destination];
    component.activeAutocomplete = 'departure';
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const sendSwapButton = host.querySelector('[data-testid="landing-route-swap"]') as HTMLButtonElement;
    expect(sendSwapButton.getAttribute('aria-label')).toBe('Inverser le départ et la destination');
    expect(sendSwapButton.querySelector('svg use')?.getAttribute('href')).toBe('#landing-i-swap');
    sendSwapButton.click();

    expect(component.departure).toBe(destination);
    expect(component.destination).toBe(departure);
    expect(component.departureQuery).toBe("Abidjan, Côte d'Ivoire");
    expect(component.destinationQuery).toBe('Paris, France');
    expect(component.travelDate).toBe('2026-10-15');
    expect(component.departureSuggestions).toEqual([]);
    expect(component.destinationSuggestions).toEqual([]);
    expect(component.activeAutocomplete).toBeNull();

    component.selectMode('transport');
    fixture.detectChanges();
    const transportSwapButton = host.querySelector('[data-testid="landing-route-swap"]') as HTMLButtonElement;
    expect(transportSwapButton).not.toBeNull();
    expect(transportSwapButton.querySelector('svg')).not.toBeNull();
  });

  it('ignores an autocomplete response started before the route is swapped', fakeAsync(() => {
    const staleSuggestions = new Subject<{ id: number; name: string; country: string; isoCode: string; type: 'CITY' }[]>();
    locationServiceMock.searchLocations.and.returnValue(staleSuggestions);
    fixture.detectChanges();

    component.departureQuery = 'Paris';
    component.onDepartureInput();
    tick(250);
    component.destinationQuery = 'Abidjan';
    component.swapRoute();
    staleSuggestions.next([{ id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' }]);

    expect(component.departureSuggestions).toEqual([]);
    expect(component.isDepartureLoading).toBeFalse();
  }));

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

    const modeButtons = Array.from(fixture.nativeElement.querySelectorAll('[role=tab]')) as HTMLButtonElement[];

    expect(modeButtons.map((button) => button.textContent?.trim())).toEqual([
      'Envoyer',
      'Voyager',
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

  it('links a landing trip card directly to the booking request page', () => {
    fixture.detectChanges();
    component.trips = [buildLandingTripCard({ reference: 'TRP-2026-000013' })];
    component.isTripsLoading = false;
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('[data-testid="landing-trip-card-link"]') as HTMLElement | null;
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/trips/ref/TRP-2026-000013/request?returnUrl=%2F&source=landing_recommended');
    expect(link?.getAttribute('aria-label')).toBe('Réserver le trajet de Paris, France vers Abidjan, Côte d\'Ivoire');
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

  for (const reference of ['TRP-2026-000013', undefined]) {
    it(`opens the owner's reservations on click ${reference ? 'with' : 'without'} a public reference`, () => {
      authServiceMock.getUser.and.returnValue({ id: 7 });
      fixture.detectChanges();
      component.trips = [buildLandingTripCard({ reference })];
      component.isTripsLoading = false;
      fixture.detectChanges();
      const navigateByUrl = spyOn(router, 'navigateByUrl').and.resolveTo(true);

      const link = fixture.nativeElement.querySelector('[data-testid="landing-trip-card-link"]') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/trips/13/reservations');
      expect(link.getAttribute('aria-label')).toBe('Voir les détails du trajet de Paris, France vers Abidjan, Côte d\'Ivoire');

      link.click();

      expect(navigateByUrl).toHaveBeenCalledTimes(1);
      expect(router.serializeUrl(navigateByUrl.calls.mostRecent().args[0] as UrlTree))
        .toBe('/trips/13/reservations');
      const travelerLink = fixture.nativeElement.querySelector('a[href="/travelers/7"]') as HTMLAnchorElement;
      expect(travelerLink.classList.contains('z-20')).toBeTrue();
      travelerLink.click();
      expect(router.serializeUrl(navigateByUrl.calls.mostRecent().args[0] as UrlTree))
        .toBe('/travelers/7');
    });
  }

  for (const signedIn of [true, false]) {
    it(`opens another traveler's booking request on click when ${signedIn ? 'signed in' : 'anonymous'}`, () => {
      authServiceMock.isLoggedIn.and.returnValue(signedIn);
      authServiceMock.getUser.and.returnValue(signedIn ? { id: 42 } : null);
      fixture.detectChanges();
      component.trips = [buildLandingTripCard({ reference: 'TRP-2026-000013' })];
      component.isTripsLoading = false;
      fixture.detectChanges();
      const navigateByUrl = spyOn(router, 'navigateByUrl').and.resolveTo(true);

      const link = fixture.nativeElement.querySelector('[data-testid="landing-trip-card-link"]') as HTMLAnchorElement;
      link.click();

      expect(navigateByUrl).toHaveBeenCalledTimes(1);
      expect(router.serializeUrl(navigateByUrl.calls.mostRecent().args[0] as UrlTree))
        .toBe('/trips/ref/TRP-2026-000013/request?returnUrl=%2F&source=landing_recommended');
    });
  }

  it('loads recommendations without requesting location permission', () => {
    fixture.detectChanges();
    expect(geolocationMock.getCurrentPosition).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Un voyage,');
    expect(tripServiceMock.getLandingFeed).toHaveBeenCalledWith(jasmine.anything(), 3);
  });

  it('shows the validated headline, local image and a single shared form', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Expédiez vos colis avec des voyageurs de confiance');
    expect(fixture.nativeElement.querySelector('.hero-photo img').getAttribute('src')).toBe('/images/landing-handoff.webp');
    expect(fixture.nativeElement.querySelectorAll('form').length).toBe(1);
  });

  it('shows an empty state and no invented trips', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aucun trajet disponible');
    expect(fixture.nativeElement.querySelector('[data-testid="landing-trip-card-link"]')).toBeNull();
  });

  it('times out the feed after eight seconds and retries', fakeAsync(() => {
    const feed = new Subject<any[]>();
    tripServiceMock.getLandingFeed.and.returnValue(feed);
    fixture.detectChanges();
    expect(component.isTripsLoading).toBeTrue();
    tick(8000);
    fixture.detectChanges();
    expect(component.tripsError).toBeTrue();
    expect(component.isTripsLoading).toBeFalse();
    tripServiceMock.getLandingFeed.and.returnValue(of([]));
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button: any) => button.textContent.trim() === 'Réessayer') as HTMLButtonElement;
    retry.click();
    expect(component.tripsError).toBeFalse();
    expect(component.trips).toEqual([]);
  }));

  it('announces validation and focuses the missing departure', () => {
    fixture.detectChanges();
    component.searchTrips();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Renseignez');
  });

  it('selects autocomplete suggestions with the keyboard', fakeAsync(() => {
    locationServiceMock.searchLocations.and.returnValue(of([{ id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' }]));
    fixture.detectChanges();
    component.departureQuery = 'Par';
    component.onDepartureInput();
    tick(250);
    component.onAutocompleteKeydown('departure', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onAutocompleteKeydown('departure', new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.departureQuery).toBe('Paris, France');
    expect(component.activeAutocomplete).toBeNull();
  }));

  it('cancels stale suggestions as soon as the query changes', fakeAsync(() => {
    const response = new Subject<any[]>();
    locationServiceMock.searchLocations.and.returnValue(response);
    fixture.detectChanges();
    component.departureQuery = 'Par'; component.onDepartureInput(); tick(250);
    component.departureQuery = 'Nan'; component.onDepartureInput();
    response.next([{ id: 1, name: 'Paris', country: 'France', type: 'CITY' }]);
    expect(component.departureSuggestions).toEqual([]);
    response.complete(); tick(250);
  }));

  it('starts at the last suggestion with ArrowUp and closes with Escape', () => {
    fixture.detectChanges();
    component.departureSuggestions = [
      { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' },
      { id: 2, name: 'Paris', country: 'Canada', isoCode: 'CA', type: 'CITY' },
    ];
    component.onAutocompleteKeydown('departure', new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.activeSuggestionIndex).toBe(1);
    component.onAutocompleteKeydown('departure', new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.activeAutocomplete).toBeNull();
    expect(component.activeSuggestionIndex).toBe(-1);
  });

  it('omits an unknown timezone country and displays actual fractional prices', () => {
    spyOn(Intl, 'DateTimeFormat').and.returnValue({ resolvedOptions: () => ({ timeZone: 'Etc/UTC' }) } as Intl.DateTimeFormat);
    tripServiceMock.getLandingFeed.and.returnValue(of([{
      id: 9, travelerId: 7, reference: 'TRP-TEST', travelerName: 'Alice Martin',
      departureAddress: 'Paris', destination: 'Abidjan', departureTime: '2026-12-21T10:30:00',
      pricePerKilo: 12.5, availableWeight: 2.5, instantAcceptance: true,
      travelerRatingAverage: 0, travelerRatingCount: 0,
    }]));
    fixture.detectChanges();
    expect(tripServiceMock.getLandingFeed).toHaveBeenCalledWith(undefined, 3);
    expect(component.trips[0].price).toBe('12,5€');
    expect(component.trips[0].capacity).toBe('2,5 kg libres');
    expect(component.trips[0].rating).toBe('Nouveau');
  });

  it('releases pending feed requests when the page is destroyed', () => {
    const feed = new Subject<any[]>();
    tripServiceMock.getLandingFeed.and.returnValue(feed);
    fixture.detectChanges();
    fixture.destroy();
    expect(feed.observed).toBeFalse();
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
