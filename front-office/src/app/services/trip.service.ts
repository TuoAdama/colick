import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from '../models/trip.model';
import { CreateBookingRequest, BookingResponse } from '../models/booking.model';

/**
 * Service responsible for trip search and booking operations.
 */
@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/trips';

  /** Search trips by departure and destination locations. */
  searchTrips(departure: string, destination: string): Observable<Trip[]> {
    const params = new HttpParams()
      .set('departure', departure)
      .set('destination', destination);
    return this.http.get<Trip[]>(`${this.baseUrl}/search`, { params });
  }

  /** Create a booking request for a specific trip. */
  createBooking(tripId: number, request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/${tripId}/bookings`, request);
  }
}
