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

  it('returns to the originating search URL', () => {
    component.goBack();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/search?from=Paris&to=Abidjan&sort=price_asc');
  });

  it('uses the page back action to return from step 2 to step 1 before leaving', () => {
    const requestForm = fixture.debugElement.query(By.directive(BookingRequestFormComponent)).componentInstance as BookingRequestFormComponent;
    requestForm.currentStep = 2;
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="booking-request-back-link"]')?.click();

    expect(requestForm.currentStep as number).toBe(1);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('falls back to the trip page when a return URL is external', () => {
    routeSnapshot.queryParamMap = convertToParamMap({ returnUrl: 'https://example.com' });
    fixture = TestBed.createComponent(BookingRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.goBack();

    expect(router.navigateByUrl).toHaveBeenCalledWith(`/trips/ref/${trip.reference}`);
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
