import type { TripSearchCriteria } from '../services/trip.service';

export interface SearchHistoryEntry {
  criteria: TripSearchCriteria;
  createdAt: string;
}
