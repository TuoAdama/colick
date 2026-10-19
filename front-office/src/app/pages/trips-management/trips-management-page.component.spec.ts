import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TripsManagementPageComponent, TripStatusFilter } from './trips-management-page.component';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { ShareCardMapperService } from '../../services/share-card-mapper.service';
import { ShareCardExportService } from '../../services/share-card-export.service';
import { Trip } from '../../models/trip.model';
import { BookingResponse } from '../../models/booking.model';

describe('TripsManagementPageComponent', () => {
  let component: TripsManagementPageComponent;
  let fixture: ComponentFixture<TripsManagementPageComponent>;
  let router: Router;
  let routeMock: {
    snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> };
  };
  let tripServiceSpy: jasmine.SpyObj<TripService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let shareCardMapperSpy: jasmine.SpyObj<ShareCardMapperService>;
  let shareCardExportSpy: jasmine.SpyObj<ShareCardExportService>;

  const mockTrips: Trip[] = [
    {
      id: 1, travelerId: 10, travelerName: 'John',
      departureAddress: 'Paris', destination: 'Lyon',
      departureTime: '2024-03-15T10:00:00', arrivalTime: '2024-03-15T14:00:00',
      maxWeight: 20, pricePerKilo: 5, instantAcceptance: false, status: 'ACTIVE', availableWeight: 15,
    },
    {
      id: 2, travelerId: 10, travelerName: 'John',
      departureAddress: 'Marseille', destination: 'Nice',
      departureTime: '2024-03-20T08:00:00', arrivalTime: '2024-03-20T10:00:00',
      maxWeight: 10, pricePerKilo: 8, instantAcceptance: true, status: 'COMPLETED', availableWeight: 0,
    },
    {
      id: 3, travelerId: 10, travelerName: 'John',
      departureAddress: 'Bordeaux', destination: 'Toulouse',
      departureTime: '2024-04-01T12:00:00', arrivalTime: '2024-04-01T15:00:00',
      maxWeight: 30, pricePerKilo: 4, instantAcceptance: false, status: 'CANCELLED', availableWeight: 30,
    },
    {
      id: 4, travelerId: 10, travelerName: 'John',
      departureAddress: 'Lille', destination: 'Strasbourg',
      departureTime: '2024-04-05T09:00:00', arrivalTime: '2024-04-05T14:00:00',
      maxWeight: 25, pricePerKilo: 6, instantAcceptance: false, status: 'ACTIVE', availableWeight: 20,
    },
    {
      id: 5, travelerId: 10, travelerName: 'John',
      departureAddress: 'Nantes', destination: 'Rennes',
      departureTime: '2024-04-10T07:00:00', arrivalTime: '2024-04-10T09:00:00',
      maxWeight: 15, pricePerKilo: 7, instantAcceptance: true, status: 'ACTIVE', availableWeight: 10,
    },
    {
      id: 6, travelerId: 10, travelerName: 'John',
      departureAddress: 'Dijon', destination: 'Grenoble',
      departureTime: '2024-04-12T11:00:00', arrivalTime: '2024-04-12T14:00:00',
      maxWeight: 18, pricePerKilo: 5, instantAcceptance: false, status: 'ACTIVE', availableWeight: 12,
    },
  ];

  const mockBookings: BookingResponse[] = [
    {
      id: 100, tripId: 1, senderId: 20, senderName: 'Alice',
      title: 'Colis A', weight: 5, recipientContact: 'alice@test.com',
      status: 'PENDING', validationCodeActive: false,
    },
    {
      id: 101, tripId: 1, senderId: 21, senderName: 'Bob',
      title: 'Colis B', weight: 3, recipientContact: 'bob@test.com',
      status: 'ACCEPTED', validationCodeActive: false,
    },
  ];

  beforeEach(async () => {
    routeMock = {
      snapshot: { queryParamMap: convertToParamMap({}) },
    };

    tripServiceSpy = jasmine.createSpyObj('TripService', ['getMyTrips', 'getTripBookings', 'completeTrip']);
    tripServiceSpy.getMyTrips.and.returnValue(of(mockTrips.map((t) => ({ ...t }))));
    tripServiceSpy.getTripBookings.and.returnValue(of([...mockBookings]));
    tripServiceSpy.completeTrip.and.returnValue(of({ ...mockTrips[0], status: 'COMPLETED' as const }));

    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUser']);
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.getUser.and.returnValue({
      id: 10, firstName: 'John', lastName: 'Doe', email: 'john@test.com',
    } as any);

    shareCardMapperSpy = jasmine.createSpyObj('ShareCardMapperService', ['mapActiveTripToShareCard', 'buildFileDate']);
    shareCardMapperSpy.buildFileDate.and.returnValue('2024-03-15');
    shareCardExportSpy = jasmine.createSpyObj('ShareCardExportService', [
      'generateQrCodeDataUrl',
      'captureElementAsPngFile',
      'downloadFile',
    ]);
    shareCardExportSpy.generateQrCodeDataUrl.and.resolveTo('data:image/png;base64,qr');
    shareCardExportSpy.captureElementAsPngFile.and.resolveTo(
      new File(['png'], 'coliclic-carte-partage-2024-03-15.png', { type: 'image/png' })
    );

    await TestBed.configureTestingModule({
      imports: [TripsManagementPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: TripService, useValue: tripServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ShareCardMapperService, useValue: shareCardMapperSpy },
        { provide: ShareCardExportService, useValue: shareCardExportSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripsManagementPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load trips on init', () => {
    expect(tripServiceSpy.getMyTrips).toHaveBeenCalled();
    expect(component.trips.length).toBe(6);
  });

  it('should load bookings for each trip', () => {
    expect(tripServiceSpy.getTripBookings).toHaveBeenCalledTimes(6);
  });

  describe('Filtering', () => {
    it('should show all trips when filter is ALL', () => {
      component.activeFilter = 'ALL';
      expect(component.filteredTrips.length).toBe(6);
    });

    it('should sort trips from the most recent departure to the oldest without reordering the source list', () => {
      expect(component.filteredTrips.map((trip) => trip.id)).toEqual([6, 5, 4, 3, 2, 1]);
      expect(component.trips.map((trip) => trip.id)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should filter by ACTIVE status', () => {
      component.setFilter('ACTIVE');
      expect(component.filteredTrips.every((t) => t.status === 'ACTIVE')).toBeTrue();
      expect(component.filteredTrips.length).toBe(4);
      expect(component.filteredTrips.map((trip) => trip.id)).toEqual([6, 5, 4, 1]);
    });

    it('should filter by COMPLETED status', () => {
      component.setFilter('COMPLETED');
      expect(component.filteredTrips.every((t) => t.status === 'COMPLETED')).toBeTrue();
      expect(component.filteredTrips.length).toBe(1);
    });

    it('should filter by CANCELLED status', () => {
      component.setFilter('CANCELLED');
      expect(component.filteredTrips.every((t) => t.status === 'CANCELLED')).toBeTrue();
      expect(component.filteredTrips.length).toBe(1);
    });

    it('should filter by search query on departure address', () => {
      component.searchQuery = 'Paris';
      expect(component.filteredTrips.length).toBe(1);
      expect(component.filteredTrips[0].departureAddress).toBe('Paris');
    });

    it('should filter by search query on destination', () => {
      component.searchQuery = 'Lyon';
      expect(component.filteredTrips.length).toBe(1);
      expect(component.filteredTrips[0].destination).toBe('Lyon');
    });

    it('should combine status filter and search query', () => {
      component.setFilter('ACTIVE');
      component.searchQuery = 'Lille';
      expect(component.filteredTrips.length).toBe(1);
      expect(component.filteredTrips[0].id).toBe(4);
    });

    it('should reset current page when filter changes', () => {
      component.currentPage = 2;
      component.setFilter('ACTIVE');
      expect(component.currentPage).toBe(1);
    });

    it('should reset current page when search changes', () => {
      component.currentPage = 2;
      component.onSearchChange();
      expect(component.currentPage).toBe(1);
    });
  });

  describe('Pagination', () => {
    it('should paginate results with default 5 items per page', () => {
      expect(component.itemsPerPage).toBe(5);
      expect(component.paginatedTrips.length).toBe(5);
      expect(component.paginatedTrips.map((trip) => trip.id)).toEqual([6, 5, 4, 3, 2]);
      expect(component.totalPages).toBe(2);
    });

    it('should navigate to the next page', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
      expect(component.paginatedTrips.length).toBe(1);
      expect(component.paginatedTrips[0].id).toBe(1);
    });

    it('should not navigate below page 1', () => {
      component.goToPage(0);
      expect(component.currentPage).toBe(1);
    });

    it('should not navigate above total pages', () => {
      component.goToPage(999);
      expect(component.currentPage).toBe(1);
    });

    it('should generate correct page numbers', () => {
      expect(component.pageNumbers).toEqual([1, 2]);
    });
  });

  describe('Pending booking count', () => {
    it('should return the total count of received bookings for a trip', () => {
      expect(component.totalBookingCount(1)).toBe(2);
    });

    it('should return 0 for the total count when a trip has no bookings mapping', () => {
      component.tripBookingsMap = {};
      expect(component.totalBookingCount(999)).toBe(0);
    });

    it('should return the count of PENDING bookings for a trip', () => {
      expect(component.pendingBookingCount(1)).toBe(1);
    });

    it('should return 0 for a trip with no bookings mapping', () => {
      component.tripBookingsMap = {};
      expect(component.pendingBookingCount(999)).toBe(0);
    });
  });

  describe('Template actions', () => {
    it('should show a success alert when arriving from trip creation and clean the URL flag', () => {
      routeMock.snapshot.queryParamMap = convertToParamMap({ created: '1' });
      const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

      fixture = TestBed.createComponent(TripsManagementPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector(
        '[data-testid="trip-created-success-alert"]'
      ) as HTMLDivElement | null;

      expect(component.creationSuccessMessage).toBe('Votre trajet a été créé avec succès.');
      expect(alert?.textContent).toContain('Votre trajet a été créé avec succès.');
      expect(navigateSpy).toHaveBeenCalledWith([], {
        relativeTo: TestBed.inject(ActivatedRoute),
        queryParams: { created: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    it('should not show a success alert without the creation flag', () => {
      const alert = fixture.nativeElement.querySelector(
        '[data-testid="trip-created-success-alert"]'
      ) as HTMLDivElement | null;

      expect(component.creationSuccessMessage).toBe('');
      expect(alert).toBeNull();
    });

    it('should render a dashboard link from the trips page header', () => {
      const dashboardLink = fixture.nativeElement.querySelector(
        '[data-testid="trips-dashboard-link"]'
      ) as HTMLAnchorElement | null;

      expect(dashboardLink).not.toBeNull();
      expect(dashboardLink?.getAttribute('href')).toContain('/dashboard');
      expect(dashboardLink?.getAttribute('aria-label')).toBe('Retour au dashboard');
    });

    it('should keep the propose trip call to action accessible', () => {
      const proposeLink = Array.from(
        fixture.nativeElement.querySelectorAll('a')
      ).find((link): link is HTMLAnchorElement =>
        (link as HTMLAnchorElement).textContent?.includes('Proposer un voyage') ?? false
      );

      expect(proposeLink).toBeDefined();
      expect(proposeLink?.getAttribute('href')).toContain('/propose');
    });

    it('should render trips in the responsive ticket list with route, date and capacity', () => {
      const ticketButtons = fixture.nativeElement.querySelectorAll(
        '[data-testid="trip-details-link"]'
      ) as NodeListOf<HTMLButtonElement>;

      expect(ticketButtons.length).toBe(5);
      expect(ticketButtons[0].textContent).toContain('Dijon');
      expect(ticketButtons[0].textContent).toContain('Grenoble');
      expect(ticketButtons[0].textContent).toContain('12');
      expect(ticketButtons[0].textContent).toContain('AVR.');
      expect(ticketButtons[0].textContent).toContain('2024');
      expect(ticketButtons[0].textContent).toContain('18 kg');
      expect(ticketButtons[0].getAttribute('aria-label')).toContain('Voir les demandes');
    });

    it('should render the total booking count badge on the view button', () => {
      const badge = fixture.nativeElement.querySelector(
        'button[aria-label="Voir les demandes"] span'
      ) as HTMLSpanElement | null;

      expect(badge).not.toBeNull();
      expect(badge?.textContent?.trim()).toBe('2');
    });

    it('should render 0 in the view badge when a trip has no bookings mapping', () => {
      component.tripBookingsMap = {};
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(
        'button[aria-label="Voir les demandes"] span'
      ) as HTMLSpanElement | null;

      expect(badge).not.toBeNull();
      expect(badge?.textContent?.trim()).toBe('0');
    });

    it('should navigate to the trip reservations page from the view button', () => {
      spyOn(router, 'navigate').and.resolveTo(true);

      const viewButton = fixture.nativeElement.querySelector(
        'button[aria-label="Voir les demandes"]'
      ) as HTMLButtonElement;

      viewButton.click();

      expect(router.navigate).toHaveBeenCalledWith(['/trips', 6, 'reservations']);
    });

    it('should navigate to trip reservations when clicking a ticket', () => {
      spyOn(router, 'navigate').and.resolveTo(true);

      const ticketButton = fixture.nativeElement.querySelector(
        '[data-testid="trip-details-link"]'
      ) as HTMLButtonElement;

      ticketButton.click();

      expect(router.navigate).toHaveBeenCalledWith(['/trips', 6, 'reservations']);
    });
  });

  describe('Status display helpers', () => {
    it('should return correct label for ACTIVE', () => {
      expect(component.tripStatusLabel('ACTIVE')).toBe('Actif');
    });

    it('should return correct label for COMPLETED', () => {
      expect(component.tripStatusLabel('COMPLETED')).toBe('Terminé');
    });

    it('should return correct label for CANCELLED', () => {
      expect(component.tripStatusLabel('CANCELLED')).toBe('Annulé');
    });

    it('should return correct dot class for each status', () => {
      expect(component.tripStatusDotClass('ACTIVE')).toBe('bg-accent');
      expect(component.tripStatusDotClass('COMPLETED')).toBe('bg-success');
      expect(component.tripStatusDotClass('CANCELLED')).toBe('bg-text-muted');
    });

    it('should return correct text class for each status', () => {
      expect(component.tripStatusTextClass('ACTIVE')).toBe('text-accent');
      expect(component.tripStatusTextClass('COMPLETED')).toBe('text-success');
      expect(component.tripStatusTextClass('CANCELLED')).toBe('text-text-muted');
    });
  });

  describe('Ticket presentation and interactions', () => {
    it('renders one responsive ticket per trip without a duplicate table', () => {
      expect(fixture.nativeElement.querySelectorAll('[data-testid="trip-ticket"]').length).toBe(5);
      expect(fixture.nativeElement.querySelector('table')).toBeNull();
      expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Mes trajets');
    });

    it('shows an orange dot only for active trips and accessible status labels for all', () => {
      expect(fixture.nativeElement.querySelectorAll('[data-testid="active-trip-dot"]').length).toBe(3);
      const tickets = fixture.nativeElement.querySelectorAll('[data-testid="trip-ticket"]');
      expect(tickets[0].querySelector('.ticket-status').textContent).toBe('Actif');
      expect(tickets[3].querySelector('.ticket-status').textContent).toBe('Annulé');
      expect(tickets[4].querySelector('.ticket-status').textContent).toBe('Terminé');
      expect(tickets[0].querySelector('.ticket-main').getAttribute('aria-label')).toContain('Actif');
    });

    it('keeps full long addresses and displays maxWeight rather than availableWeight', () => {
      component.trips = [{ ...mockTrips[0], departureAddress: 'Nantes, France',
        destination: 'Abidjan, Côte d’Ivoire — une adresse particulièrement longue', maxWeight: 30, availableWeight: 4 }];
      fixture.detectChanges();
      const ticket = fixture.nativeElement.querySelector('[data-testid="trip-ticket"]');
      expect(ticket.querySelectorAll('.route-city')[1].textContent).toBe(component.trips[0].destination);
      expect(ticket.querySelector('.capacity-badge').textContent).toContain('30 kg');
      expect(ticket.querySelector('time').getAttribute('datetime')).toBe(mockTrips[0].departureTime);
    });

    it('combines filter and search through the rendered controls and resets pagination', () => {
      component.currentPage = 2;
      const filters = fixture.nativeElement.querySelectorAll('.status-filter');
      filters[1].click();
      fixture.detectChanges();
      expect(component.currentPage).toBe(1);
      expect(filters[1].getAttribute('aria-pressed')).toBe('true');
      const input = fixture.nativeElement.querySelector('input[type="search"]');
      input.value = 'Lille';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('[data-testid="trip-ticket"]').length).toBe(1);
      expect(fixture.nativeElement.querySelector('.route-city').textContent).toBe('Lille');
    });

    it('keeps edit actions outside the trip navigation button', () => {
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      const ticket = fixture.nativeElement.querySelector('[data-testid="trip-ticket"]');
      expect(ticket.querySelector('.ticket-main button')).toBeNull();
      ticket.querySelector('button[aria-label="Modifier le trajet"]').click();
      expect(navigate).toHaveBeenCalledOnceWith(['/propose', 6]);
      expect(ticket.querySelector('.ticket-actions').textContent).toContain('5 € / kg');
    });

    it('completes an active trip from the ticket options menu', () => {
      const firstTicket = fixture.nativeElement.querySelector('[data-testid="trip-ticket"]');
      firstTicket.querySelector('app-trip-options-menu button').click();
      fixture.detectChanges();
      const items = Array.from(firstTicket.querySelectorAll('[role="menuitem"]')) as HTMLButtonElement[];
      items.find(item => item.textContent?.includes('Marquer comme terminé'))!.click();
      fixture.detectChanges();
      expect(tripServiceSpy.completeTrip).toHaveBeenCalledWith(6);
    });

    it('downloads the share card from the ticket options without opening reservations', () => {
      const download = spyOn(component, 'downloadShareCardPng').and.resolveTo();
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      const firstTicket = fixture.nativeElement.querySelector('[data-testid="trip-ticket"]');
      firstTicket.querySelector('app-trip-options-menu button').click();
      fixture.detectChanges();
      const item = firstTicket.querySelector('[role="menuitem"]') as HTMLButtonElement;
      item.click();
      expect(download).toHaveBeenCalledOnceWith(6);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('shows loading, error and empty states without tickets', () => {
      component.isLoading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="trips-loading"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="trip-ticket"]')).toBeNull();
      component.isLoading = false;
      component.loadError = 'Impossible de charger vos trajets.';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(component.loadError);
      component.loadError = '';
      component.searchQuery = 'introuvable';
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Aucun trajet trouvé.');
      expect(fixture.nativeElement.querySelector('[data-testid="trip-ticket"]')).toBeNull();
    });

    it('formats French abbreviated months independently of browser locale', () => {
      expect(component.tripMonth('2026-02-01T10:30:00')).toBe('FÉVR.');
      expect(component.tripMonth('2026-08-21T10:30:00')).toBe('AOÛT');
      expect(component.tripMonth('2026-12-21T10:30:00')).toBe('DÉC.');
    });
  });

  describe('Date formatting', () => {
    it('should format a date string correctly', () => {
      const result = component.formatTripDate('2024-03-15T10:00:00');
      expect(result).toBe('15 Mars 2024 • 10:00');
    });
  });

  describe('Trip completion', () => {
    it('should call completeTrip on the service', () => {
      component.markTripCompleted(1);
      expect(tripServiceSpy.completeTrip).toHaveBeenCalledWith(1);
    });

    it('should update the trip status after completion', () => {
      component.markTripCompleted(1);
      expect(component.trips[0].status).toBe('COMPLETED');
      expect(component.completingTripId).toBeNull();
    });

    it('should not call completeTrip if one is already in progress', () => {
      component.completingTripId = 99;
      component.markTripCompleted(1);
      expect(tripServiceSpy.completeTrip).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle trip loading error', () => {
      tripServiceSpy.getMyTrips.and.returnValue(throwError(() => new Error('fail')));
      component.loadTrips();
      expect(component.loadError).toBe('Impossible de charger vos trajets.');
      expect(component.isLoading).toBeFalse();
    });
  });
});
