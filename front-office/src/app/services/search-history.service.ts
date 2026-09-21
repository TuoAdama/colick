import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { SearchHistoryEntry } from '../models/search-history.model';
import type { TripSearchCriteria } from './trip.service';

@Injectable({ providedIn: 'root' })
export class SearchHistoryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'coliclic.search-history';
  private readonly maxEntries = 10;

  getEntries(): SearchHistoryEntry[] {
    if (!isPlatformBrowser(this.platformId)) return [];

    const raw = this.readStoredValue();
    if (!raw) return [];

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry): entry is SearchHistoryEntry => this.isValidEntry(entry))
        .slice(0, this.maxEntries);
    } catch {
      return [];
    }
  }

  add(criteria: TripSearchCriteria): SearchHistoryEntry[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    if (!criteria.departure?.trim() || !criteria.destination?.trim()) {
      return this.getEntries();
    }

    const normalized: TripSearchCriteria = {
      departure: criteria.departure.trim(),
      destination: criteria.destination.trim(),
      date: criteria.date?.trim() || undefined,
      sort: criteria.sort ?? 'price_asc',
      minPrice: criteria.minPrice ?? null,
      maxPrice: criteria.maxPrice ?? null,
    };
    const key = this.criteriaKey(normalized);
    const next: SearchHistoryEntry[] = [
      { criteria: normalized, createdAt: new Date().toISOString() },
      ...this.getEntries().filter((entry) => this.criteriaKey(entry.criteria) !== key),
    ].slice(0, this.maxEntries);

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(next));
    } catch {
      // Search history is optional; a storage failure must not block search.
    }
    return next;
  }

  clear(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore disabled or unavailable browser storage.
    }
  }

  private readStoredValue(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  private criteriaKey(criteria: TripSearchCriteria): string {
    return JSON.stringify({
      departure: criteria.departure ?? '',
      destination: criteria.destination ?? '',
      date: criteria.date ?? '',
      sort: criteria.sort ?? 'price_asc',
      minPrice: criteria.minPrice ?? null,
      maxPrice: criteria.maxPrice ?? null,
    });
  }

  private isValidEntry(value: unknown): value is SearchHistoryEntry {
    if (!value || typeof value !== 'object') return false;
    const entry = value as Partial<SearchHistoryEntry>;
    const criteria = entry.criteria;
    return typeof entry.createdAt === 'string'
      && !!criteria
      && typeof criteria.departure === 'string'
      && criteria.departure.trim().length > 0
      && typeof criteria.destination === 'string'
      && criteria.destination.trim().length > 0;
  }
}
