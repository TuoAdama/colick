import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TripService } from './trip.service';

describe('TripService', () => {
  let service: TripService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TripService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TripService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('searches trips and normalizes traveler photo URLs', () => {
    service.searchTrips('Paris', 'Abidjan').subscribe((trips) => {
      expect(trips).toHaveSize(1);
      expect(trips[0].travelerPhotoUrl).toBe('/api/uploads/traveler.png');
      expect(trips[0].travelerRatingCount).toBe(12);
    });

    const req = httpMock.expectOne('/api/trips/search?departure=Paris&destination=Abidjan');
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 4,
        travelerId: 2,
        travelerName: 'Alice Martin',
        travelerPhotoUrl: '/uploads/traveler.png',
        travelerRatingAverage: 4.8,
        travelerRatingCount: 12,
        departureAddress: 'Paris',
        destination: 'Abidjan',
        departureTime: '2025-03-02T08:00:00Z',
        arrivalTime: '2025-03-02T16:00:00Z',
        maxWeight: 20,
        pricePerKilo: 15,
        instantAcceptance: true,
        status: 'ACTIVE',
        availableWeight: 6,
      },
    ]);
  });

  it('gets a trip by id and normalizes traveler photo URLs', () => {
    service.getTripById(12).subscribe((trip) => {
      expect(trip.id).toBe(12);
      expect(trip.travelerPhotoUrl).toBe('/api/uploads/traveler.png');
      expect(trip.travelerRatingCount).toBe(0);
    });

    const req = httpMock.expectOne('/api/trips/12');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 12,
      travelerId: 2,
      travelerName: 'Alice Martin',
      travelerPhotoUrl: '/uploads/traveler.png',
      travelerRatingAverage: 4.8,
      travelerRatingCount: null,
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-03-02T08:00:00Z',
      arrivalTime: '2025-03-02T16:00:00Z',
      maxWeight: 20,
      pricePerKilo: 15,
      instantAcceptance: true,
      status: 'ACTIVE',
      availableWeight: 6,
    });
  });

  it('updates a trip proposal', () => {
    service.updateTrip(12, {
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-03-02T08:00',
      arrivalTime: '2025-03-02T16:00',
      maxWeight: 22,
      pricePerKilo: 17,
      instantAcceptance: false,
    }).subscribe((trip) => {
      expect(trip.id).toBe(12);
      expect(trip.pricePerKilo).toBe(17);
    });

    const req = httpMock.expectOne('/api/trips/12');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-03-02T08:00',
      arrivalTime: '2025-03-02T16:00',
      maxWeight: 22,
      pricePerKilo: 17,
      instantAcceptance: false,
    });
    req.flush({
      id: 12,
      travelerId: 2,
      travelerName: 'Alice Martin',
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-03-02T08:00:00Z',
      arrivalTime: '2025-03-02T16:00:00Z',
      maxWeight: 22,
      pricePerKilo: 17,
      instantAcceptance: false,
      status: 'ACTIVE',
      availableWeight: 8,
    });
  });

  it('calls complete trip endpoint', () => {
    service.completeTrip(12).subscribe();

    const req = httpMock.expectOne('/api/trips/12/complete');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('calls booking delivery confirmation endpoint with validation code', () => {
    service.confirmBookingDelivery(12, 34, { validationCode: '123456' }).subscribe();

    const req = httpMock.expectOne('/api/trips/12/bookings/34/deliver');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ validationCode: '123456' });
    req.flush({});
  });
});
