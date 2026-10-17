import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Location } from '../models/location.model';

/**
 * Service responsible for fetching location data from the API.
 * Used primarily for auto-complete functionality.
 */
@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/locations';

  /**
   * Search locations by query string for auto-complete suggestions.
   * @param query - The search query (partial location name)
   * @returns Observable of matching locations
   */
  searchLocations(query: string): Observable<Location[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Location[]>(`${this.baseUrl}/search`, { params });
  }
}
