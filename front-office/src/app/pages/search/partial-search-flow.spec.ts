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
import { SearchHistoryService } from '../../services/search-history.service';

// Exercise real route navigation and browser history storage across both screens.
describe('Partial trip search flow', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let tripService: { searchTrips: jasmine.Spy; getLandingFeed: jasmine.Spy };

  beforeEach(async () => {
    localStorage.removeItem('coliclic.search-history');
    tripService = {
      searchTrips: jasmine.createSpy('searchTrips').and.returnValue(of([])),
      getLandingFeed: jasmine.createSpy('getLandingFeed').and.returnValue(of([])),
    };
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: LandingPageComponent },
          { path: 'search', component: SearchPageComponent },
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
