import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { routes } from '../../app.routes';
import { RegisterRequest } from '../../models/auth.model';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';
import { TripService } from '../../services/trip.service';

@Component({ standalone: true, template: '<h1>Destination</h1>' })
class DestinationComponent {}

describe('Trip detail reservation flow', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let signedIn: boolean;
  const searchUrl = '/search?from=Paris&to=Abidjan&sort=rating_desc';
  const detailUrl = '/trips/ref/TRP-2026-000013?returnUrl=' + encodeURIComponent(searchUrl) + '&source=search_results';
  let createBooking: jasmine.Spy;
  let register: jasmine.Spy;
  let confirmEmail: jasmine.Spy;
  let googleCredential: (credential: string) => void;
  const user = { id: 44, email: 'ada@example.com' };

  beforeEach(async () => {
    signedIn = true;
    createBooking = jasmine.createSpy().and.returnValue(of({ id: 71, tripId: 13, status: 'PENDING' }));
    register = jasmine.createSpy().and.returnValue(of(user));
    confirmEmail = jasmine.createSpy().and.returnValue(of(user));
    const authenticate = () => {
      signedIn = true;
      return of({ user });
    };
    await TestBed.configureTestingModule({ providers: [
      provideRouter([
        ...routes.filter(route => ['trips/ref/:reference', 'trips/ref/:reference/request', 'login', 'register', 'confirm-email'].includes(route.path ?? '')),
        { path: 'search', component: DestinationComponent },
        { path: '404', component: DestinationComponent },
        routes.find(route => route.path === '**')!,
      ]),
      { provide: AuthService, useValue: {
        currentUser$: new BehaviorSubject(user), getUser: () => signedIn ? user : null,
        initializeSession: () => Promise.resolve(), isLoggedIn: () => signedIn, getSessionStatus: () => signedIn ? 'authenticated' : 'anonymous',
        register, confirmEmail, login: authenticate, googleLogin: authenticate,
      } },
      { provide: GoogleIdentityService, useValue: {
        renderButton: async (_host: HTMLElement, _text: string, callback: typeof googleCredential) => {
          googleCredential = callback;
          return true;
        },
      } },
      { provide: AnalyticsService, useValue: { track: jasmine.createSpy() } },
      { provide: TripService, useValue: {
        getTripByReference: () => of({ id: 13, reference: 'TRP-2026-000013', travelerId: 99, travelerName: 'Aminata K.',
          departureAddress: 'Paris', destination: 'Abidjan', departureTime: '2026-11-12T10:30:00', arrivalTime: '2026-11-12T17:00:00',
          availableWeight: 15, maxWeight: 15, pricePerKilo: 12, instantAcceptance: false, status: 'ACTIVE' }),
        getMyBookings: () => of([]), createBooking,
        getParcelGuidelines: () => of({ version: '2026-09-01', prohibitedItems: ['Armes'], packagingRecommendations: ['Emballage rigide'],
          allowedPhotoContentTypes: ['image/jpeg'], maxPhotoBytes: 5000000 }),
      } },
    ] }).compileComponents();
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    await harness.navigateByUrl(detailUrl);
  });

  async function click(selector: string): Promise<void> {
    harness.routeNativeElement!.querySelector<HTMLElement>(selector)!.click();
    await settleNavigation();
  }

  async function settleNavigation(): Promise<void> {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  async function startRegistrationFromTrip(): Promise<string> {
    signedIn = false;
    await click('.booking-summary .reserve-button');
    const requestUrl = router.parseUrl(router.url).queryParams['returnUrl'];
    await click('a[href^="/register"]');
    expect(router.parseUrl(router.url).queryParams['returnUrl']).toBe(requestUrl);
    const loginHref = harness.routeNativeElement!.querySelector('a[href^="/login"]')!.getAttribute('href')!;
    expect(router.parseUrl(loginHref).queryParams['returnUrl']).toBe(requestUrl);
    return requestUrl;
  }

  async function activateAndLogIn(returnUrl?: string): Promise<void> {
    // Open the activation URL directly, as an email client would in a fresh tab.
    await harness.navigateByUrl(router.createUrlTree(['/confirm-email'], {
      queryParams: { token: 'signup-token', returnUrl },
    }).toString());
    await click('button');
    expect(confirmEmail).toHaveBeenCalledOnceWith('signup-token');
    await click('a[href^="/login"]');
    await submitForm({ '#email': user.email, '#password': 'password123' });
  }

  async function submitRegistration(): Promise<RegisterRequest> {
    await submitForm({
      '#firstName': 'Ada', '#lastName': 'Lovelace', '#reg-email': user.email,
      '#reg-password': 'password123', '#confirmPassword': 'password123',
    });
    expect(register).toHaveBeenCalledTimes(1);
    return register.calls.mostRecent().args[0];
  }

  async function submitForm(fields: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(fields)) {
      const input = harness.routeNativeElement!.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    harness.detectChanges();
    await click('button[type="submit"]');
  }

  function expectBookingForm(requestUrl: string): void {
    expect(router.url).toBe(requestUrl);
    expect(router.url).toContain('/trips/ref/TRP-2026-000013/request?');
    const queryParams = router.parseUrl(router.url).queryParams;
    expect(queryParams['returnUrl']).toBe(detailUrl);
    expect(queryParams['resultsReturnUrl']).toBe(searchUrl);
    expect(harness.routeNativeElement!.querySelector('#booking-title')).not.toBeNull();
  }

  it('returns from the request to the detail and then to the original filtered results', async () => {
    await click('.booking-summary .reserve-button');
    expect(router.url).toContain('/request?');
    await click('[data-testid="booking-request-back-link"]');
    expect(router.url).toBe(detailUrl);
    await click('.back-link');
    expect(router.url).toBe(searchUrl);
  });

  it('completes the existing parcel form and preserves the filtered results link', async () => {
    await click('.booking-summary .reserve-button');
    for (const [selector, value] of [['#booking-title', 'Documents'], ['#booking-weight', '2'], ['#booking-recipient', 'recipient@example.com']]) {
      const input = harness.routeNativeElement!.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    const next = Array.from(harness.routeNativeElement!.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Continuer')!;
    next.click();
    harness.detectChanges();
    await click('input[type="checkbox"]');
    await click('button[type="submit"]');
    expect(createBooking).toHaveBeenCalledWith(13, jasmine.objectContaining({ title: 'Documents', weight: 2 }));
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Demande envoyée');
    await click('[data-testid="booking-results-link"]');
    expect(router.url).toBe(searchUrl);
  });

  it('allows anonymous viewing and requests login only when reserving', async () => {
    signedIn = false;
    expect(router.url).toBe(detailUrl);
    await click('.booking-summary .reserve-button');
    const login = router.parseUrl(router.url);
    expect(router.url).toContain('/login?returnUrl=');
    const request = router.parseUrl(login.queryParams['returnUrl']);
    expect(request.root.children['primary'].segments.map(segment => segment.path).join('/')).toBe('trips/ref/TRP-2026-000013/request');
    expect(request.queryParams['returnUrl']).toBe(detailUrl);
    expect(request.queryParams['resultsReturnUrl']).toBe(searchUrl);
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('returns to the original booking form after Google signup', async () => {
    const requestUrl = await startRegistrationFromTrip();
    googleCredential('google-id-token');
    await settleNavigation();
    expectBookingForm(requestUrl);
  });

  it('returns to the original booking form after email signup, activation and login', async () => {
    const requestUrl = await startRegistrationFromTrip();
    const payload = await submitRegistration();
    expect(payload.returnUrl).toBe(requestUrl);
    expect(router.parseUrl(router.url).queryParams['returnUrl']).toBe(requestUrl);
    expect(harness.routeNativeElement!.querySelector('[role="status"]')?.textContent).toContain('lien de confirmation');
    await activateAndLogIn(payload.returnUrl);
    expectBookingForm(requestUrl);
  });

  it('preserves query parameters and a fragment for another internal destination', async () => {
    signedIn = false;
    const returnUrl = '/search?from=Paris%20Est&to=Abidjan#results';
    await harness.navigateByUrl(router.createUrlTree(['/register'], { queryParams: { returnUrl } }).toString());
    const payload = await submitRegistration();
    expect(payload.returnUrl).toBe(returnUrl);
    await activateAndLogIn(payload.returnUrl);
    expect(router.url).toBe(returnUrl);
  });

  const fallbackCases = [
    { label: 'direct signup', returnUrl: undefined, forwarded: undefined },
    { label: 'external URL', returnUrl: 'https://example.com', forwarded: undefined },
    { label: 'protocol-relative URL', returnUrl: '//example.com', forwarded: undefined },
    { label: 'encoded backslash', returnUrl: '/%5Cexample.com', forwarded: undefined },
    { label: 'malformed encoding', returnUrl: '/search?from=%ZZ', forwarded: undefined },
    { label: 'unknown route', returnUrl: '/missing-route', forwarded: '/missing-route' },
  ];

  for (const { label, returnUrl, forwarded } of fallbackCases) {
    const registerUrl = () => router.createUrlTree(['/register'], { queryParams: { returnUrl } }).toString();

    it(`uses search after Google signup for ${label}`, async () => {
      signedIn = false;
      await harness.navigateByUrl(registerUrl());
      googleCredential('google-id-token');
      await settleNavigation();
      expect(router.url).toBe('/search');
    });

    it(`uses search after email signup for ${label}`, async () => {
      signedIn = false;
      await harness.navigateByUrl(registerUrl());
      const payload = await submitRegistration();
      expect(payload.returnUrl).toBe(forwarded);
      expect(router.parseUrl(router.url).queryParams['returnUrl']).toBe(forwarded);
      await activateAndLogIn(returnUrl);
      expect(router.url).toBe('/search');
    });
  }
});
