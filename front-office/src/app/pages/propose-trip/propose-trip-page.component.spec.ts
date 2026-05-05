import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import { LocationService } from '../../services/location.service';
import { TripService } from '../../services/trip.service';
import { ProposeTripPageComponent } from './propose-trip-page.component';

describe('ProposeTripPageComponent', () => {
  let fixture: ComponentFixture<ProposeTripPageComponent>;
  let component: ProposeTripPageComponent;
  let router: Router;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let routeMock: {
    paramMap: Observable<ReturnType<typeof convertToParamMap>>;
    snapshot: { paramMap: ReturnType<typeof convertToParamMap> };
  };

  const tripServiceMock = {
    createTrip: jasmine.createSpy('createTrip').and.returnValue(of({})),
    getTripById: jasmine.createSpy('getTripById').and.returnValue(of({
      id: 12,
      travelerId: 1,
      travelerName: 'Ada',
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-05-10T08:00:00',
      arrivalTime: '2025-05-10T16:00:00',
      maxWeight: 20,
      pricePerKilo: 15,
      instantAcceptance: true,
      status: 'ACTIVE',
      availableWeight: 8,
    })),
    updateTrip: jasmine.createSpy('updateTrip').and.returnValue(of({})),
  };

  const locationServiceMock = {
    searchLocations: jasmine.createSpy('searchLocations').and.returnValue(of([])),
  };

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));
    routeMock = {
      paramMap: paramMapSubject.asObservable(),
      snapshot: { paramMap: convertToParamMap({}) },
    };

    await TestBed.configureTestingModule({
      imports: [ProposeTripPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: TripService, useValue: tripServiceMock },
        { provide: LocationService, useValue: locationServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    tripServiceMock.createTrip.calls.reset();
    tripServiceMock.getTripById.calls.reset();
    tripServiceMock.updateTrip.calls.reset();
    tripServiceMock.createTrip.and.returnValue(of({}));
    tripServiceMock.getTripById.and.returnValue(of({
      id: 12,
      travelerId: 1,
      travelerName: 'Ada',
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-05-10T08:00:00',
      arrivalTime: '2025-05-10T16:00:00',
      maxWeight: 20,
      pricePerKilo: 15,
      instantAcceptance: true,
      status: 'ACTIVE',
      availableWeight: 8,
    }));
    tripServiceMock.updateTrip.and.returnValue(of({}));

    fixture = TestBed.createComponent(ProposeTripPageComponent);
    component = fixture.componentInstance;
  });

  function setRouteId(id?: string): void {
    const paramMap = convertToParamMap(id ? { id } : {});
    routeMock.snapshot.paramMap = paramMap;
    paramMapSubject.next(paramMap);
  }

  it('creates a trip in creation mode and redirects to search', () => {
    setRouteId();
    fixture.detectChanges();

    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.departureTime = '2025-05-10T08:00';
    component.arrivalTime = '2025-05-10T16:00';
    component.maxWeight = 20;
    component.pricePerKilo = 15;
    component.instantAcceptance = true;

    component.submit();

    expect(tripServiceMock.createTrip).toHaveBeenCalledWith({
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-05-10T08:00',
      arrivalTime: '2025-05-10T16:00',
      maxWeight: 20,
      pricePerKilo: 15,
      instantAcceptance: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/search']);
  });

  it('loads an active trip in edit mode, pre-fills the form and updates it', () => {
    setRouteId('12');
    fixture.detectChanges();

    expect(tripServiceMock.getTripById).toHaveBeenCalledWith(12);
    expect(component.isEditMode).toBeTrue();
    expect(component.departureQuery).toBe('Paris, France');
    expect(component.destinationQuery).toBe("Abidjan, Côte d'Ivoire");
    expect(component.departure?.name).toBe('Paris');
    expect(component.departure?.country).toBe('France');

    fixture.detectChanges();

    const autocompleteComponents = fixture.debugElement.queryAll(
      By.directive(AutocompleteComponent)
    );
    expect(autocompleteComponents[0].componentInstance.initialQuery).toBe('Paris, France');
    expect(autocompleteComponents[0].componentInstance.query).toBe('Paris, France');
    expect(autocompleteComponents[1].componentInstance.initialQuery).toBe("Abidjan, Côte d'Ivoire");
    expect(autocompleteComponents[1].componentInstance.query).toBe("Abidjan, Côte d'Ivoire");

    component.maxWeight = 25;
    component.submit();

    expect(tripServiceMock.updateTrip).toHaveBeenCalledWith(12, {
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: component.departureTime,
      arrivalTime: component.arrivalTime,
      maxWeight: 25,
      pricePerKilo: 15,
      instantAcceptance: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard'], {
      queryParams: { tab: 'received' },
    });
  });

  it('blocks editing when the loaded trip is not active', () => {
    tripServiceMock.getTripById.and.returnValue(of({
      id: 15,
      travelerId: 1,
      travelerName: 'Ada',
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-05-10T08:00:00',
      arrivalTime: '2025-05-10T16:00:00',
      maxWeight: 20,
      pricePerKilo: 15,
      instantAcceptance: true,
      status: 'COMPLETED',
      availableWeight: 0,
    }));

    setRouteId('15');
    fixture.detectChanges();

    expect(component.canEditTrip).toBeFalse();
    expect(component.errorMessage).toContain('Seuls les voyages actifs peuvent être modifiés.');

    component.submit();

    expect(tripServiceMock.updateTrip).not.toHaveBeenCalled();
  });

  it('shows a loading error when the trip cannot be fetched in edit mode', () => {
    tripServiceMock.getTripById.and.returnValue(throwError(() => new Error('boom')));

    setRouteId('18');
    fixture.detectChanges();

    expect(component.errorMessage).toContain('Une erreur est survenue lors du chargement du voyage.');
    expect(component.isPageLoading).toBeFalse();
  });
});
