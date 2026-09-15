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
      departureTime: '2099-05-10T08:00:00',
      arrivalTime: '2099-05-10T16:00:00',
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
      departureTime: '2099-05-10T08:00:00',
      arrivalTime: '2099-05-10T16:00:00',
      maxWeight: 20,
      pricePerKilo: 15,
      instantAcceptance: true,
      status: 'ACTIVE',
      availableWeight: 8,
    }));
    tripServiceMock.updateTrip.and.returnValue(of({}));
    document.documentElement.lang = 'fr';

    fixture = TestBed.createComponent(ProposeTripPageComponent);
    component = fixture.componentInstance;
  });

  function setRouteId(id?: string): void {
    const paramMap = convertToParamMap(id ? { id } : {});
    routeMock.snapshot.paramMap = paramMap;
    paramMapSubject.next(paramMap);
  }

  it('creates a trip in creation mode and redirects to trips management with a success flag', () => {
    setRouteId();
    fixture.detectChanges();

    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.departureTime = '2099-05-10T08:00';
    component.arrivalTime = '2099-05-10T16:00';
    component.maxWeight = 20;
    component.pricePerKilo = 15;
    component.instantAcceptance = true;

    component.submit();

    expect(tripServiceMock.createTrip).toHaveBeenCalledWith({
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2099-05-10T08:00',
      arrivalTime: '2099-05-10T16:00',
      maxWeight: 20,
      pricePerKilo: 15,
      instantAcceptance: true,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/trips'], {
      queryParams: { created: '1' },
    });
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

  it('renders a compact centered layout without the hero banner', () => {
    setRouteId();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const header = host.querySelector('[data-testid="propose-trip-header"]') as HTMLElement | null;
    const formRegion = host.querySelector('[data-testid="propose-trip-form-region"]') as HTMLElement | null;
    const formWrapper = host.querySelector('[data-testid="propose-trip-form-wrapper"]') as HTMLElement | null;
    const formCard = host.querySelector('[data-testid="propose-trip-form-card"]') as HTMLElement | null;

    expect(host.querySelector('section.hero-gradient')).toBeNull();
    expect(header).not.toBeNull();
    expect(header?.textContent).toContain('Proposer un voyage');
    expect(header?.className).toContain('max-w-2xl');
    expect(header?.className).not.toContain('rounded-3xl');
    expect(header?.className).not.toContain('bg-white');
    expect(host.textContent).toContain('Retour à l\'accueil');
    expect(host.textContent).not.toContain('Nouveau trajet');
    expect(formRegion).not.toBeNull();
    expect(formWrapper).not.toBeNull();
    expect(formCard).not.toBeNull();
    expect(formWrapper?.className).toContain('mx-auto');
    expect(formWrapper?.className).toContain('max-w-3xl');
    expect(host.textContent).toContain('Ville de départ *');
    expect(host.textContent).toContain('Destination *');
  });

  it('keeps the mobile form card and date fields within the viewport', () => {
    setRouteId();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const formCard = host.querySelector('[data-testid="propose-trip-form-card"]') as HTMLElement;
    const dateInputs = Array.from(host.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]'));

    expect(formCard.className).toContain('-mx-4');
    expect(formCard.className).toContain('sm:mx-0');
    expect(dateInputs).toHaveSize(2);
    dateInputs.forEach((input) => {
      expect(input.className).toContain('block');
      expect(input.className).toContain('min-w-0');
      expect(input.className).toContain('max-w-full');
      expect(input.className).toContain('appearance-none');
      expect(input.className).toContain('bg-bg-secondary');
    });
  });

  it('renders the publish button without an icon and keeps the loading spinner', () => {
    setRouteId();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const submitButton = host.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.querySelector('svg')).toBeNull();
    expect(submitButton.textContent).toContain('Publier le voyage');

    component.isLoading = true;
    fixture.detectChanges();

    const loadingButton = host.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(loadingButton.querySelector('svg.animate-spin')).not.toBeNull();
    expect(loadingButton.textContent).toContain('Publication en cours');
  });

  it('blocks editing when the loaded trip is not active', () => {
    tripServiceMock.getTripById.and.returnValue(of({
      id: 15,
      travelerId: 1,
      travelerName: 'Ada',
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2099-05-10T08:00:00',
      arrivalTime: '2099-05-10T16:00:00',
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

  // --- Backend error message surfacing (issue #74) ---

  it('shows the backend message when createTrip fails with a structured error', () => {
    setRouteId();
    fixture.detectChanges();

    tripServiceMock.createTrip.and.returnValue(
      throwError(() => ({ error: { message: 'departureTime: doit être une date dans le futur' } }))
    );

    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.departureTime = '2099-05-10T08:00';
    component.arrivalTime = '2099-05-10T16:00';
    component.maxWeight = 20;
    component.pricePerKilo = 15;

    component.submit();

    expect(component.errorMessage).toBe('Veuillez choisir une date et une heure de départ dans le futur.');
  });

  it('falls back to the generic publish error when createTrip fails without a backend message', () => {
    setRouteId();
    fixture.detectChanges();

    tripServiceMock.createTrip.and.returnValue(throwError(() => new Error('network error')));

    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.departureTime = '2099-05-10T08:00';
    component.arrivalTime = '2099-05-10T16:00';
    component.maxWeight = 20;
    component.pricePerKilo = 15;

    component.submit();

    expect(component.errorMessage).toContain('Une erreur est survenue lors de la publication du voyage.');
  });

  it('shows the backend message when updateTrip fails with a structured error', () => {
    setRouteId('12');
    fixture.detectChanges();

    tripServiceMock.updateTrip.and.returnValue(
      throwError(() => ({ error: { message: 'maxWeight: Max weight must be at least 1 kg' } }))
    );

    component.submit();

    expect(component.errorMessage).toBe('Max weight must be at least 1 kg');
  });

  it('falls back to the generic update error when updateTrip fails without a backend message', () => {
    setRouteId('12');
    fixture.detectChanges();

    tripServiceMock.updateTrip.and.returnValue(throwError(() => ({ error: {} })));

    component.submit();

    expect(component.errorMessage).toContain('Une erreur est survenue lors de la mise à jour du voyage.');
  });

  it('shows the backend message when getTripById fails with a structured error', () => {
    tripServiceMock.getTripById.and.returnValue(
      throwError(() => ({ error: { message: 'Trip not found' } }))
    );

    setRouteId('99');
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Trip not found');
    expect(component.isPageLoading).toBeFalse();
  });

  it('blocks submission on the client when the departure date is in the past', () => {
    setRouteId();
    fixture.detectChanges();

    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.departureTime = '2000-05-10T08:00';
    component.arrivalTime = '2099-05-10T16:00';
    component.maxWeight = 20;
    component.pricePerKilo = 15;

    component.submit();

    expect(component.errorMessage).toBe('Veuillez choisir une date et une heure de départ dans le futur.');
    expect(tripServiceMock.createTrip).not.toHaveBeenCalled();
  });

  it('shows an English contextual message when the page language is English', () => {
    document.documentElement.lang = 'en';
    setRouteId();
    fixture.detectChanges();

    tripServiceMock.createTrip.and.returnValue(
      throwError(() => ({ error: { message: 'arrivalTime: must be a date in the future' } }))
    );

    component.departure = { id: 1, name: 'Paris', country: 'France', isoCode: 'FR', type: 'CITY' };
    component.destination = { id: 2, name: 'Abidjan', country: "Côte d'Ivoire", isoCode: 'CI', type: 'CITY' };
    component.departureTime = '2099-05-10T08:00';
    component.arrivalTime = '2099-05-10T16:00';
    component.maxWeight = 20;
    component.pricePerKilo = 15;

    component.submit();

    expect(component.errorMessage).toBe('Please choose an estimated arrival date and time in the future.');
  });
});
