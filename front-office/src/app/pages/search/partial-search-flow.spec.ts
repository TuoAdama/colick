import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { LandingPageComponent } from '../landing/landing-page.component';
import { SearchPageComponent } from './search-page.component';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { TripAlertService } from '../../services/trip-alert.service';
import { MessagingService } from '../../services/messaging.service';
import { LocationService } from '../../services/location.service';
import { Trip } from '../../models/trip.model';
import { SearchHistoryService } from '../../services/search-history.service';

@Component({ standalone: true, template: '' })
class TripDestinationComponent {}

// Exercise real route navigation and browser history storage across both screens.
describe('Partial trip search flow', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let tripService: { searchTrips: jasmine.Spy; getLandingFeed: jasmine.Spy; getCatalog: jasmine.Spy };

  beforeEach(async () => {
    localStorage.removeItem('coliclic.search-history');
    tripService = {
      getCatalog: jasmine.createSpy('getCatalog').and.returnValue(of({ items: [], totalElements: 0, hasNext: false, page: 0, size: 20 })),
      searchTrips: jasmine.createSpy('searchTrips').and.returnValue(of([])),
      getLandingFeed: jasmine.createSpy('getLandingFeed').and.returnValue(of([])),
    };
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: LandingPageComponent },
          { path: 'search', component: SearchPageComponent },
          { path: 'trips/ref/:reference', component: TripDestinationComponent },
        ]),
        { provide: TripService, useValue: tripService },
        { provide: AuthService, useValue: { isLoggedIn: () => false, getUser: () => null } },
        { provide: LocationService, useValue: { searchLocations: () => of([]) } },
        { provide: TripAlertService, useValue: {} },
        { provide: MessagingService, useValue: {} },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => localStorage.removeItem('coliclic.search-history'));

  it('opens the catalogue from the home link and restores filters after visiting a trip', async () => {
    const trip: Trip = {
      id: 1, reference: 'TRP-2027-000001', travelerId: 2, travelerName: 'Alice',
      departureAddress: 'Paris', destination: 'Abidjan', departureTime: '2027-01-01T10:00:00',
      arrivalTime: '2027-01-01T18:00:00', maxWeight: 20, availableWeight: 10,
      pricePerKilo: 5, instantAcceptance: false, status: 'ACTIVE',
    };
    tripService.getCatalog.and.returnValue(of({ items: [trip], totalElements: 1, hasNext: false, page: 0, size: 20 }));
    await harness.navigateByUrl('/', LandingPageComponent);
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('.all-trips')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/search?mode=all');
    expect(tripService.getCatalog).toHaveBeenCalledWith(jasmine.objectContaining({ sort: 'departure_asc' }), 0);
    const page = harness.routeDebugElement!.componentInstance as SearchPageComponent;
    page.minPrice = 4;
    page.selectedDate = '2027-01-01';
    page.onFilterChange();
    await harness.fixture.whenStable();
    const returnUrl = page.resultsReturnUrl;
    expect(router.parseUrl(returnUrl).queryParams).toEqual(jasmine.objectContaining({ mode: 'all', minPrice: '4', date: '2027-01-01' }));
    page.openTripDetails(trip);
    await harness.fixture.whenStable();
    expect(router.url).toContain('/trips/ref/TRP-2027-000001?');
    expect(router.parseUrl(router.url).queryParams['returnUrl']).toBe(returnUrl);
    const restored = await harness.navigateByUrl(returnUrl, SearchPageComponent);
    expect(restored.isCatalog).toBeTrue();
    expect(restored.minPrice).toBe(4);
    expect(restored.selectedDate).toBe('2027-01-01');
    expect(TestBed.inject(SearchHistoryService).getEntries()).toEqual([]);
  });

  it('navigates from the home form, refines, reloads and restores a partial search', async () => {
    await harness.navigateByUrl('/', LandingPageComponent);
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#landing-departure')!;
    input.value = 'Paris';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    const button = Array.from(harness.routeNativeElement!.querySelectorAll('button'))
      .find(element => element.textContent?.includes('Trouver un voyageur'));
    expect(button).toBeDefined();
    button!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/search?from=Paris');
    expect(tripService.searchTrips).toHaveBeenCalledWith(jasmine.objectContaining({ departure: 'Paris', destination: undefined }));

    const page = harness.routeDebugElement!.componentInstance as SearchPageComponent;
    page.onDestinationSelected({ id: 2, name: 'Abidjan', country: '', isoCode: '', type: 'CITY' });
    page.selectedDate = '2027-01-01';
    page.searchTrips();
    await harness.fixture.whenStable();
    expect(tripService.searchTrips).toHaveBeenCalledWith(jasmine.objectContaining({ departure: 'Paris', destination: 'Abidjan', date: '2027-01-01' }));
    const refinedUrl = router.url;
    await harness.navigateByUrl('/', LandingPageComponent);
    const reloaded = await harness.navigateByUrl(refinedUrl, SearchPageComponent);
    expect(reloaded.destination?.name).toBe('Abidjan');
    expect(reloaded.selectedDate).toBe('2027-01-01');

    const entry = TestBed.inject(SearchHistoryService).getEntries().find(item => !item.criteria.destination)!;
    expect(entry.criteria.departure).toBe('Paris');
    reloaded.selectSearchHistory(entry);
    await harness.fixture.whenStable();
    expect(reloaded.departure?.name).toBe('Paris');
    expect(reloaded.destination).toBeNull();
    expect(router.parseUrl(router.url).queryParams['to']).toBeUndefined();
    expect(tripService.searchTrips).toHaveBeenCalledTimes(4);
  });
});
