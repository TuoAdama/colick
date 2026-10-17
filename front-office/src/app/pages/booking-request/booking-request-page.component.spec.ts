import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Trip } from '../../models/trip.model';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { BookingRequestPageComponent } from './booking-request-page.component';
import { BookingRequestFormComponent } from '../../shared/components/booking-request-form/booking-request-form.component';

describe('BookingRequestPageComponent', () => {
  let fixture: ComponentFixture<BookingRequestPageComponent>;
  let component: BookingRequestPageComponent;
  let router: Router;

  const trip = buildTrip();
  const routeSnapshot = {
    paramMap: convertToParamMap({ reference: trip.reference }),
    queryParamMap: convertToParamMap({
      returnUrl: '/search?from=Paris&to=Abidjan&sort=price_asc',
      source: 'search_results',
      weight: '2.5',
    }),
  };
  const tripServiceMock = {
    getTripByReference: jasmine.createSpy('getTripByReference'),
    createBooking: jasmine.createSpy('createBooking'),
    getParcelGuidelines: jasmine.createSpy('getParcelGuidelines').and.returnValue(of({
      version: '2026-09-01',
      prohibitedItems: ['Armes'],
      packagingRecommendations: ['Emballage rigide'],
      allowedPhotoContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxPhotoBytes: 5 * 1024 * 1024,
    })),
  };
  const authServiceMock = { getUser: jasmine.createSpy('getUser') };
  const analyticsMock = { track: jasmine.createSpy('track') };

  beforeEach(async () => {
    routeSnapshot.queryParamMap = convertToParamMap({
      returnUrl: '/search?from=Paris&to=Abidjan&sort=price_asc',
      source: 'search_results',
      weight: '2.5',
    });
    tripServiceMock.getTripByReference.and.returnValue(of(trip));
    authServiceMock.getUser.and.returnValue({ id: 44 });
    analyticsMock.track.calls.reset();

    await TestBed.configureTestingModule({
      imports: [BookingRequestPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: routeSnapshot } },
        { provide: TripService, useValue: tripServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: AnalyticsService, useValue: analyticsMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingRequestPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('loads the trip and displays the full-page request form', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(tripServiceMock.getTripByReference).toHaveBeenCalledWith(trip.reference);
    expect(host.querySelector('app-booking-request-form')).not.toBeNull();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(component.initialWeight).toBe(2.5);
    expect(analyticsMock.track).toHaveBeenCalledWith('request_started', jasmine.objectContaining({
      trip_id: trip.id,
      source: 'search_results',
    }));
  });

  it('renders the selected trip above the parcel step and restores the heading on return', () => {
    const host = fixture.nativeElement as HTMLElement;
    const requestForm = fixture.debugElement.query(By.directive(BookingRequestFormComponent)).componentInstance as BookingRequestFormComponent;
    const header = host.querySelector('[data-testid="booking-request-header"]')!;

    expect(header.querySelector('[data-testid="booking-route"]')?.textContent).toContain(trip.departureAddress);
    expect(header.querySelector('[data-testid="booking-capacity"]')?.textContent).toContain('10 kg disponibles · 5 €/kg');
    expect(header.querySelector('h1')?.textContent?.trim()).toBe('Votre colis');

    requestForm.bookingForm.patchValue({ title: 'Documents', weight: 1, recipientContact: 'recipient@example.com' });
    Array.from(host.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Continuer')?.click();
    fixture.detectChanges();
    expect(header.querySelector('[data-testid="booking-step"]')?.textContent).toBe('Étape 2 sur 2');
    expect(header.querySelector('h1')?.textContent?.trim()).toBe('Photo et sécurité');

    host.querySelector<HTMLButtonElement>('[data-testid="booking-request-back-link"]')?.click();
    fixture.detectChanges();
    expect(header.querySelector('h1')?.textContent?.trim()).toBe('Votre colis');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('returns to the originating search URL', () => {
    component.goBack();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/search?from=Paris&to=Abidjan&sort=price_asc');
  });

  it('opens the selected traveler profile from either request step without submitting a booking', () => {
    const host = fixture.nativeElement as HTMLElement;
    const requestForm = fixture.debugElement.query(By.directive(BookingRequestFormComponent)).componentInstance as BookingRequestFormComponent;
    const submissionsBefore = tripServiceMock.createBooking.calls.count();

    for (const step of [1, 2] as const) {
      requestForm.currentStep = step;
      fixture.detectChanges();
      const link = host.querySelector<HTMLAnchorElement>('[data-testid="booking-traveler-profile"]')!;
      expect(link.textContent).toContain(trip.travelerName);
      link.click();

      expect((router.navigateByUrl as jasmine.Spy).calls.mostRecent().args[0].toString()).toBe(`/travelers/${trip.travelerId}`);
      expect(requestForm.currentStep).toBe(step);
    }

    expect(tripServiceMock.createBooking.calls.count()).toBe(submissionsBefore);
    expect(component.returnUrl).toBe('/search?from=Paris&to=Abidjan&sort=price_asc');
  });

  it('keeps the landing return URL and analytics source for recommended trips', () => {
    routeSnapshot.queryParamMap = convertToParamMap({
      returnUrl: '/?mode=transport',
      source: 'landing_recommended',
    });
    fixture = TestBed.createComponent(BookingRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.returnUrl).toBe('/?mode=transport');
    expect(analyticsMock.track).toHaveBeenCalledWith('request_started', jasmine.objectContaining({
      source: 'landing_recommended',
    }));
  });

  it('uses the page back action to return from step 2 to step 1 before leaving', () => {
    const requestForm = fixture.debugElement.query(By.directive(BookingRequestFormComponent)).componentInstance as BookingRequestFormComponent;
    requestForm.currentStep = 2;
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="booking-request-back-link"]')?.click();

    expect(requestForm.currentStep as number).toBe(1);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('falls back to search when a return URL is external', () => {
    routeSnapshot.queryParamMap = convertToParamMap({ returnUrl: 'https://example.com' });
    fixture = TestBed.createComponent(BookingRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.goBack();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/search');
  });

  it('completes the two-step request and offers working tracking and filtered results links', async () => {
    tripServiceMock.createBooking.and.returnValue(of({ id: 71, tripId: trip.id, status: 'PENDING' }));
    const host = fixture.nativeElement as HTMLElement;
    for (const [selector, value] of [
      ['#booking-title', 'Documents'],
      ['#booking-weight', '2'],
      ['#booking-recipient', 'recipient@example.com'],
    ]) {
      const input = host.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    Array.from(host.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Continuer')!.click();
    fixture.detectChanges();
    host.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    fixture.detectChanges();
    host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(tripServiceMock.createBooking).toHaveBeenCalledWith(trip.id, jasmine.objectContaining({ title: 'Documents', weight: 2 }));
    expect(host.querySelector('[data-testid="booking-request-back-link"]')).toBeNull();
    expect(host.querySelector('form')).toBeNull();
    expect(host.querySelector('h1')?.textContent).toBe('Demande envoyée');
    expect(document.activeElement).toBe(host.querySelector('h1'));
    expect(analyticsMock.track).toHaveBeenCalledWith('request_submitted', jasmine.objectContaining({ booking_id: 71 }));
    host.querySelector<HTMLAnchorElement>('[data-testid="booking-follow-link"]')!.click();
    expect((router.navigateByUrl as jasmine.Spy).calls.mostRecent().args[0].toString()).toBe(`/sent-bookings/${trip.id}/71`);
    host.querySelector<HTMLAnchorElement>('[data-testid="booking-results-link"]')!.click();
    expect((router.navigateByUrl as jasmine.Spy).calls.mostRecent().args[0].toString()).toBe('/search?from=Paris&to=Abidjan&sort=price_asc');
  });

  for (const returnUrl of ['/trips/ref/TRP-2026-000013', 'https://example.com', '//example.com', '/search-other']) {
    it(`uses search as the results fallback for ${returnUrl}`, () => {
      routeSnapshot.queryParamMap = convertToParamMap({ returnUrl });
      fixture = TestBed.createComponent(BookingRequestPageComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.resultsReturnUrl).toBe('/search');
      const requestForm = fixture.debugElement.query(By.directive(BookingRequestFormComponent)).componentInstance as BookingRequestFormComponent;
      expect(requestForm.resultsReturnUrl).toBe('/search');
    });
  }

  it('normalizes legacy trip detail return URLs with query parameters', () => {
    routeSnapshot.queryParamMap = convertToParamMap({ returnUrl: '/trips/ref/TRP-2026-000013?utm_source=share' });
    fixture = TestBed.createComponent(BookingRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.goBack();

    expect(component.returnUrl).toBe('/search');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/search');
  });

  it('does not allow booking the current user’s own trip', () => {
    authServiceMock.getUser.and.returnValue({ id: trip.travelerId });
    fixture = TestBed.createComponent(BookingRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.trip).toBeNull();
    expect(component.errorMessage).toContain('votre propre trajet');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-booking-request-form')).toBeNull();
  });

  it('shows an unavailable message if the trip cannot be loaded', () => {
    tripServiceMock.getTripByReference.and.returnValue(throwError(() => new Error('not found')));
    fixture = TestBed.createComponent(BookingRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage).toContain('introuvable');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Impossible d’envoyer une demande');
  });
});

function buildTrip(): Trip {
  return {
    id: 13,
    reference: 'TRP-2026-000013',
    travelerId: 99,
    travelerName: 'Alice Dupont',
    departureAddress: 'Paris',
    destination: 'Abidjan',
    departureTime: '2026-05-01T08:00:00Z',
    arrivalTime: '2026-05-02T08:00:00Z',
    maxWeight: 10,
    availableWeight: 10,
    pricePerKilo: 5,
    instantAcceptance: false,
    status: 'ACTIVE',
  };
}
