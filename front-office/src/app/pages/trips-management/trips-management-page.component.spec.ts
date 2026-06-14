import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TripsManagementPageComponent, TripStatusFilter } from './trips-management-page.component';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { ShareCardMapperService } from '../../services/share-card-mapper.service';
import { Trip } from '../../models/trip.model';
import { BookingResponse } from '../../models/booking.model';

describe('TripsManagementPageComponent', () => {
  let component: TripsManagementPageComponent;
  let fixture: ComponentFixture<TripsManagementPageComponent>;
  let router: Router;
  let tripServiceSpy: jasmine.SpyObj<TripService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let shareCardMapperSpy: jasmine.SpyObj<ShareCardMapperService>;

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

    await TestBed.configureTestingModule({
      imports: [TripsManagementPageComponent],
      providers: [
        provideRouter([]),
        { provide: TripService, useValue: tripServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ShareCardMapperService, useValue: shareCardMapperSpy },
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

    it('should filter by ACTIVE status', () => {
      component.setFilter('ACTIVE');
      expect(component.filteredTrips.every((t) => t.status === 'ACTIVE')).toBeTrue();
      expect(component.filteredTrips.length).toBe(4);
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
      expect(component.totalPages).toBe(2);
    });

    it('should navigate to the next page', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
      expect(component.paginatedTrips.length).toBe(1);
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

      expect(router.navigate).toHaveBeenCalledWith(['/trips', 1, 'reservations']);
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
