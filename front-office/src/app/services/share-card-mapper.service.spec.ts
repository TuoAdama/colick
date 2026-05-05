import { TestBed } from '@angular/core/testing';
import { Trip } from '../models/trip.model';
import { ShareCardMapperService } from './share-card-mapper.service';

describe('ShareCardMapperService', () => {
  let service: ShareCardMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareCardMapperService);
  });

  it('maps active trip data with FR date formatting', () => {
    const trip = buildTrip({
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-07-14T12:00:00Z',
      availableWeight: 8.5,
      pricePerKilo: 12,
    });

    const result = service.mapActiveTripToShareCard(trip, {
      email: 'traveler@example.com',
      phone: '+33 6 00 00 00 00',
    });

    expect(result.city).toBe('Abidjan');
    expect(result.country).toBe("Côte d'Ivoire");
    expect(result.formattedDate).toContain('14');
    expect(result.formattedDate).toContain('2025');
    expect(result.phone).toBe('+33 6 00 00 00 00');
    expect(result.email).toBe('traveler@example.com');
    expect(result.availableWeightLabel).toBe('8,5 kg');
    expect(result.pricePerKiloLabel).toBe('12,00 € / kg');
  });

  it('masks optional fields when source data is missing', () => {
    const trip = buildTrip({
      destination: '',
      departureTime: '',
      availableWeight: Number.NaN,
      pricePerKilo: Number.NaN,
    });

    const result = service.mapActiveTripToShareCard(trip, {
      email: '   ',
      phone: '',
    });

    expect(result.city).toBeNull();
    expect(result.country).toBeNull();
    expect(result.formattedDate).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.availableWeightLabel).toBeNull();
    expect(result.pricePerKiloLabel).toBeNull();
  });

  it('keeps only city when destination has one segment', () => {
    const result = service.mapActiveTripToShareCard(buildTrip({ destination: 'Douala' }), {
      email: 'douala@example.com',
      phone: undefined,
    });

    expect(result.city).toBe('Douala');
    expect(result.country).toBeNull();
  });

  it('builds a file date from the trip date', () => {
    expect(service.buildFileDate('2025-07-14T12:00:00Z')).toBe('2025-07-14');
  });

  it('returns today when file date cannot be parsed', () => {
    const fallbackDate = service.buildFileDate('invalid-date');
    expect(fallbackDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

function buildTrip(overrides: Partial<Trip>): Trip {
  return {
    id: 1,
    travelerId: 2,
    travelerName: 'Ada',
    departureAddress: 'Paris',
    destination: 'Abidjan',
    departureTime: '2025-07-14T12:00:00Z',
    arrivalTime: '2025-07-14T20:00:00Z',
    maxWeight: 20,
    pricePerKilo: 10,
    instantAcceptance: true,
    status: 'ACTIVE',
    availableWeight: 8,
    ...overrides,
  };
}
