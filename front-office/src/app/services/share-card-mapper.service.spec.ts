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
      reference: 'TRP-2026-000001',
      departureAddress: 'Paris, France',
      destination: "Abidjan, Côte d'Ivoire",
      departureTime: '2025-07-14T12:00:00Z',
      availableWeight: 8.5,
      pricePerKilo: 12,
    });

    const result = service.mapActiveTripToShareCard(trip, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'traveler@example.com',
      phone: '+33 6 00 00 00 00',
      photoUrl: '/photos/ada.png',
    }, {
      shareOrigin: 'https://colick.test',
    });

    expect(result.departureCity).toBe('Paris');
    expect(result.departureCountry).toBe('France');
    expect(result.destinationCity).toBe('Abidjan');
    expect(result.destinationCountry).toBe("Côte d'Ivoire");
    expect(result.routeLabel).toBe('Paris → Abidjan');
    expect(result.formattedDate).toContain('2025');
    expect(result.formattedTime).toMatch(/^\d{2}:\d{2}$/);
    expect(result.formattedArrivalDate).toContain('2025');
    expect(result.formattedArrivalTime).toMatch(/^\d{2}:\d{2}$/);
    expect(result.formattedDateTime).toContain('14');
    expect(result.formattedDateTime).toContain('2025');
    expect(result.formattedDateTime).toContain(':');
    expect(result.travelerName).toBe('Ada Lovelace');
    expect(result.phone).toBe('+33 6 00 00 00 00');
    expect(result.email).toBe('traveler@example.com');
    expect(result.travelerPhotoUrl).toBe('/photos/ada.png');
    expect(result.availableWeightLabel).toBe('8,5 kg');
    expect(result.pricePerKiloLabel).toBe('12€ / kg');
    expect(result.shareUrl).toContain('https://colick.test/search?');
    expect(result.shareUrl).toContain('from=Paris%2C+France');
    expect(result.shareUrl).toContain('to=Abidjan%2C+C%C3%B4te+d%27Ivoire');
    expect(result.shareUrl).toContain('date=2025-07-14');
    expect(result.shareUrlLabel).toBe('colick.test/search');
    expect(result.tripReference).toBe('TRP-2026-000001');
  });

  it('falls back to a local reference when the API reference is missing', () => {
    const result = service.mapActiveTripToShareCard(buildTrip({
      id: 13,
      reference: undefined,
    }), {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'traveler@example.com',
      phone: '+33 6 00 00 00 00',
    });

    expect(result.tripReference).toBe('#T000D');
  });

  it('masks optional fields when source data is missing', () => {
    const trip = buildTrip({
      departureAddress: '',
      destination: '',
      departureTime: '',
      arrivalTime: '',
      travelerName: '',
      availableWeight: Number.NaN,
      maxWeight: Number.NaN,
      pricePerKilo: Number.NaN,
    });

    const result = service.mapActiveTripToShareCard(trip, {
      firstName: '   ',
      lastName: '',
      email: '   ',
      phone: '',
    });

    expect(result.departureCity).toBeNull();
    expect(result.departureCountry).toBeNull();
    expect(result.destinationCity).toBeNull();
    expect(result.destinationCountry).toBeNull();
    expect(result.routeLabel).toBeNull();
    expect(result.formattedDate).toBeNull();
    expect(result.formattedTime).toBeNull();
    expect(result.formattedDateTime).toBeNull();
    expect(result.formattedArrivalDate).toBeNull();
    expect(result.formattedArrivalTime).toBeNull();
    expect(result.formattedArrivalDateTime).toBeNull();
    expect(result.travelerName).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.travelerPhotoUrl).toBeNull();
    expect(result.availableWeightLabel).toBeNull();
    expect(result.pricePerKiloLabel).toBeNull();
    expect(result.tripReference).toBe('#T0001');
  });

  it('keeps single-segment locations and builds a route label', () => {
    const result = service.mapActiveTripToShareCard(buildTrip({ destination: 'Douala' }), {
      firstName: 'Ada',
      lastName: '',
      email: 'douala@example.com',
      phone: undefined,
    });

    expect(result.departureCity).toBe('Paris');
    expect(result.destinationCity).toBe('Douala');
    expect(result.routeLabel).toBe('Paris → Douala');
  });

  it('uses maxWeight when availableWeight is missing', () => {
    const result = service.mapActiveTripToShareCard(buildTrip({ availableWeight: Number.NaN, maxWeight: 17 }), {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+33 6 00 00 00 00',
    });

    expect(result.availableWeightLabel).toBe('17 kg');
  });

  it('uses the provided available weight override for reservation sharing', () => {
    const result = service.mapActiveTripToShareCard(buildTrip({ availableWeight: 17, maxWeight: 20 }), {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+33 6 00 00 00 00',
    }, {
      availableWeight: 9,
    });

    expect(result.availableWeightLabel).toBe('9 kg');
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
