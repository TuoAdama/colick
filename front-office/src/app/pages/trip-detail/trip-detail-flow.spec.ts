import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';
import { routes } from '../../app.routes';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
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

  beforeEach(async () => {
    signedIn = true;
    createBooking = jasmine.createSpy().and.returnValue(of({ id: 71, tripId: 13, status: 'PENDING' }));
    await TestBed.configureTestingModule({ providers: [
      provideRouter([
        ...routes.filter(route => route.path === 'trips/ref/:reference' || route.path === 'trips/ref/:reference/request'),
        { path: 'login', component: DestinationComponent },
        { path: 'search', component: DestinationComponent },
      ]),
      { provide: AuthService, useValue: {
        currentUser$: new BehaviorSubject({ id: 44 }), getUser: () => signedIn ? { id: 44 } : null,
        initializeSession: () => Promise.resolve(), isLoggedIn: () => signedIn, getSessionStatus: () => signedIn ? 'authenticated' : 'anonymous',
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
    await harness.fixture.whenStable();
    harness.detectChanges();
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
});
