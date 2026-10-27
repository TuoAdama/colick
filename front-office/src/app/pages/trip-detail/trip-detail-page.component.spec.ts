import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { AnalyticsService } from '../../services/analytics.service';
import { TripDetailPageComponent } from './trip-detail-page.component';

describe('TripDetailPageComponent', () => {
  let fixture: ComponentFixture<TripDetailPageComponent>;
  let component: TripDetailPageComponent;
  let trip: Trip;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let user: BehaviorSubject<{ id: number } | null>;
  let service: { getTripByReference: jasmine.Spy; getMyBookings: jasmine.Spy };
  let analytics: { track: jasmine.Spy };

  beforeEach(async () => {
    trip = { id: 13, reference: 'TRP-2026-000013', travelerId: 99, travelerName: 'Aminata K.',
      travelerRatingAverage: 4.9, travelerRatingCount: 24, departureAddress: 'Paris (CDG)', destination: 'Abidjan (ABJ)',
      departureTime: '2026-11-12T10:30:00', arrivalTime: '2026-11-13T17:00:00',
      maxWeight: 20, availableWeight: 15, pricePerKilo: 12, instantAcceptance: false, status: 'ACTIVE' };
    params = new BehaviorSubject(convertToParamMap({ reference: trip.reference }));
    query = new BehaviorSubject(convertToParamMap({ returnUrl: '/search?from=Paris&to=Abidjan&sort=rating_desc', source: 'search_results' }));
    user = new BehaviorSubject<{ id: number } | null>(null);
    service = { getTripByReference: jasmine.createSpy().and.returnValue(of(trip)), getMyBookings: jasmine.createSpy().and.returnValue(of([])) };
    analytics = { track: jasmine.createSpy() };
    await TestBed.configureTestingModule({ imports: [TripDetailPageComponent], providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: params, queryParamMap: query } },
      { provide: TripService, useValue: service },
      { provide: AuthService, useValue: { currentUser$: user, getUser: () => user.value } },
      { provide: AnalyticsService, useValue: analytics },
    ] }).compileComponents();
    fixture = TestBed.createComponent(TripDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders actual trip dates, capacity, rating and profile before any request starts', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('Paris (CDG)');
    expect(host.querySelector('.itinerary')?.textContent).toContain('12 novembre 2026');
    expect(host.querySelector('.itinerary')?.textContent).toContain('13 novembre 2026');
    expect(host.querySelector('.itinerary')?.textContent).toContain('10:30');
    expect(host.querySelector('.traveler')?.textContent).toContain('4,9');
    expect(host.querySelector('.traveler')?.textContent).toContain('24 avis');
    expect(host.querySelector('.profile-link')?.getAttribute('href')).toBe('/travelers/99');
    expect(host.querySelector('.booking-summary')?.textContent).toContain('15 kg');
    expect(host.querySelector('.mobile-booking')?.textContent).toContain('12 €/kg');
    expect(service.getMyBookings).not.toHaveBeenCalled();
    expect(analytics.track).toHaveBeenCalledWith('detail_opened', jasmine.objectContaining({ trip_id: 13 }));
    expect(analytics.track).not.toHaveBeenCalledWith('request_started', jasmine.anything());
  });

  it('opens the request from either booking button and preserves both return destinations', () => {
    const router = TestBed.inject(Router);
    const url = '/trips/ref/TRP-2026-000013?source=search_results';
    spyOnProperty(router, 'url', 'get').and.returnValue(url);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    for (const button of fixture.nativeElement.querySelectorAll('.reserve-button')) button.click();
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith(['/trips/ref', trip.reference, 'request'], { queryParams: {
      returnUrl: url, resultsReturnUrl: '/search?from=Paris&to=Abidjan&sort=rating_desc', source: 'search_results',
    } });
  });

  it('switches the approval wording for instant acceptance', () => {
    trip.instantAcceptance = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.conditions').textContent).toContain('Confirmation instantanée');
    expect(fixture.nativeElement.querySelector('.conditions').textContent).not.toContain('Sur accord');
  });

  it('shows a neutral fallback for a traveler without ratings', () => {
    trip.travelerRatingCount = 0;
    trip.travelerRatingAverage = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.rating').textContent).toContain('Nouveau · Aucun avis');
  });

  it('prevents self booking and an existing pending or accepted request', () => {
    user.next({ id: 99 });
    expect(component.bookingLabel).toBe('Votre trajet');
    for (const status of ['PENDING', 'ACCEPTED']) {
      service.getMyBookings.and.returnValue(of([{ tripId: 13, status }]));
      user.next({ id: 44 });
      fixture.detectChanges();
      expect(component.bookingLabel).toBe('Demande envoyée');
      expect(fixture.nativeElement.querySelector('.reserve-button').disabled).toBeTrue();
    }
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    component.reserve();
    expect(navigate).not.toHaveBeenCalled();
    service.getMyBookings.and.returnValue(of([{ tripId: 13, status: 'CANCELLED' }]));
    user.next({ id: 44 });
    expect(component.canBook).toBeTrue();
  });

  it('disables booking when capacity is exhausted or the trip is inactive', () => {
    trip.availableWeight = 0;
    expect(component.canBook).toBeFalse();
    trip.availableWeight = 15;
    trip.status = 'CANCELLED';
    expect(component.canBook).toBeFalse();
  });

  it('loads a new reference when navigating between trips', () => {
    params.next(convertToParamMap({ reference: 'TRP-2026-000099' }));
    expect(service.getTripByReference).toHaveBeenCalledWith('TRP-2026-000099');
  });

  it('shows a loading state and then an accessible unavailable state on error', () => {
    const response = new Subject<Trip>();
    service.getTripByReference.and.returnValue(response);
    params.next(convertToParamMap({ reference: 'missing' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    response.error(new Error('404'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('introuvable');
    expect(fixture.nativeElement.querySelector('.reserve-button')).toBeNull();
    service.getTripByReference.and.returnValue(throwError(() => new Error('offline')));
    params.next(convertToParamMap({ reference: 'offline' }));
    expect(component.isLoading).toBeFalse();
  });

  it('rejects external and unrelated return destinations', () => {
    for (const returnUrl of ['https://example.com', '//example.com', '/search-other', '/trips/ref/other']) {
      query.next(convertToParamMap({ returnUrl }));
      expect(component.returnUrl).toBe('/search');
    }
    query.next(convertToParamMap({ returnUrl: '/?mode=transport', source: 'landing_recommended' }));
    expect(component.returnUrl).toBe('/?mode=transport');
    expect(component.source).toBe('landing_recommended');
  });
});
