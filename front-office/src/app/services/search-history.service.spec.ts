import { TestBed } from '@angular/core/testing';
import { TripSearchCriteria } from './trip.service';
import { SearchHistoryService } from './search-history.service';

const STORAGE_KEY = 'coliclic.search-history';

function criteria(index: number): TripSearchCriteria {
  return {
    departure: `Departure ${index}`,
    destination: `Destination ${index}`,
    date: `2026-10-${String(index + 1).padStart(2, '0')}`,
    sort: 'departure_asc',
    minPrice: index,
    maxPrice: index + 10,
  };
}

describe('SearchHistoryService', () => {
  let service: SearchHistoryService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchHistoryService);
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('returns an empty history when storage is empty', () => {
    expect(service.getEntries()).toEqual([]);
  });

  it('adds a search at the beginning of the history', () => {
    const result = service.add(criteria(1));

    expect(result).toHaveSize(1);
    expect(result[0].criteria).toEqual(criteria(1));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toEqual(result);
  });

  it('moves a duplicate search to the beginning instead of storing it twice', () => {
    service.add(criteria(1));
    service.add(criteria(2));

    const result = service.add({ ...criteria(1), departure: ' Departure 1 ' });

    expect(result).toHaveSize(2);
    expect(result[0].criteria).toEqual(criteria(1));
  });

  it('keeps only the ten most recent searches', () => {
    for (let index = 0; index < 12; index += 1) {
      service.add(criteria(index));
    }

    const result = service.getEntries();
    expect(result).toHaveSize(10);
    expect(result[0].criteria).toEqual(criteria(11));
    expect(result[9].criteria).toEqual(criteria(2));
  });

  it('ignores malformed stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { criteria: { departure: 'Paris' }, createdAt: '2026-09-21T00:00:00.000Z' },
      { criteria: criteria(1), createdAt: '2026-09-21T00:00:00.000Z' },
    ]));

    expect(service.getEntries()).toHaveSize(1);
    expect(service.getEntries()[0].criteria).toEqual(criteria(1));

    localStorage.setItem(STORAGE_KEY, '{invalid-json');
    expect(service.getEntries()).toEqual([]);
  });

  it('keeps searches working when browser storage is unavailable', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('storage unavailable');
    spyOn(Storage.prototype, 'setItem').and.throwError('storage unavailable');
    spyOn(Storage.prototype, 'removeItem').and.throwError('storage unavailable');

    expect(() => service.getEntries()).not.toThrow();
    expect(() => service.add(criteria(1))).not.toThrow();
    expect(() => service.clear()).not.toThrow();
  });

  it('clears the complete history', () => {
    service.add(criteria(1));

    service.clear();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(service.getEntries()).toEqual([]);
  });
});
