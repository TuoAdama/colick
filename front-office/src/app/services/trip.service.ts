import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from '../models/trip.model';

/**
 * Service responsible for searching trips from the API.
 */
@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/trips';

  /**
   * Search trips by departure and destination locations.
   * @param departure - The departure location name
   * @param destination - The destination location name
   * @returns Observable of matching trips
   */
  searchTrips(departure: string, destination: string): Observable<Trip[]> {
    const params = new HttpParams()
      .set('departure', departure)
      .set('destination', destination);
    return this.http.get<Trip[]>(`${this.baseUrl}/search`, { params });
  }
}
