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

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true),
  };

  const locationServiceMock = {
    searchLocations: jasmine.createSpy('searchLocations').and.returnValue(of([])),
  };

  const tripServiceMock = {
    getLandingFeed: jasmine.createSpy('getLandingFeed').and.returnValue(of([])),
  };

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
});
