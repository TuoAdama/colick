import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Trip } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { TripReferencePageComponent } from './trip-reference-page.component';

describe('TripReferencePageComponent', () => {
  let fixture: ComponentFixture<TripReferencePageComponent>;
  let component: TripReferencePageComponent;
  let router: Router;
  const paramMap$ = new BehaviorSubject(convertToParamMap({ reference: 'TRP-2026-000013' }));

  const tripServiceMock = {
    getTripByReference: jasmine.createSpy('getTripByReference'),
    createBooking: jasmine.createSpy('createBooking'),
  };

  const authServiceMock = {
    isLoggedIn: jasmine.createSpy('isLoggedIn'),
    getUser: jasmine.createSpy('getUser'),
  };

  beforeEach(async () => {
    paramMap$.next(convertToParamMap({ reference: 'TRP-2026-000013' }));
    tripServiceMock.getTripByReference.calls.reset();
    tripServiceMock.createBooking.calls.reset();
    tripServiceMock.getTripByReference.and.returnValue(of(buildTrip()));
    tripServiceMock.createBooking.and.returnValue(of({ id: 1, title: 'Colis', tripId: 13 }));
    authServiceMock.isLoggedIn.calls.reset();
    authServiceMock.getUser.calls.reset();
    authServiceMock.isLoggedIn.and.returnValue(false);
    authServiceMock.getUser.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [TripReferencePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
          },
        },
        { provide: TripService, useValue: tripServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripReferencePageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/trips/ref/TRP-2026-000013');
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('loads and displays the trip matching the reference', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(tripServiceMock.getTripByReference).toHaveBeenCalledWith('TRP-2026-000013');
    expect(host.textContent).toContain('TRP-2026-000013');
    expect(host.textContent).toContain('Paris, France');
    expect(host.textContent).toContain("Abidjan, Côte d'Ivoire");
    expect(host.textContent).toContain('8 kg disponibles');
  });

  it('redirects anonymous users to login with returnUrl when booking is requested', () => {
    component.openBookingModal();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/trips/ref/TRP-2026-000013' },
    });
    expect(component.isBookingModalOpen).toBeFalse();
  });

  it('opens the booking modal for authenticated users', () => {
    authServiceMock.isLoggedIn.and.returnValue(true);
    authServiceMock.getUser.and.returnValue({ id: 99 });

    component.openBookingModal();

    expect(component.isBookingModalOpen).toBeTrue();
  });

  it('shows an error when the reference cannot be resolved', () => {
    tripServiceMock.getTripByReference.and.returnValue(throwError(() => new Error('not found')));
    paramMap$.next(convertToParamMap({ reference: 'TRP-404' }));
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(component.trip).toBeNull();
    expect(host.textContent).toContain('Annonce introuvable');
  });
});

function buildTrip(): Trip {
  return {
    id: 13,
    reference: 'TRP-2026-000013',
    travelerId: 2,
    travelerName: 'Alice Martin',
    travelerRatingAverage: 4.8,
    travelerRatingCount: 12,
    departureAddress: 'Paris, France',
    destination: "Abidjan, Côte d'Ivoire",
    departureTime: '2026-07-14T12:00:00Z',
    arrivalTime: '2026-07-14T20:00:00Z',
    maxWeight: 20,
    availableWeight: 8,
    pricePerKilo: 12,
    instantAcceptance: true,
    status: 'ACTIVE',
  };
}
