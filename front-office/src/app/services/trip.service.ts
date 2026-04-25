import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, CreateTripDto } from '../models/trip.model';
import { CreateBookingRequest, BookingResponse } from '../models/booking.model';

/**
 * Service responsible for trip search, creation, and booking operations.
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

  /** Create a new trip proposal. */
  createTrip(data: CreateTripDto): Observable<Trip> {
    return this.http.post<Trip>(this.baseUrl, data);
  }

  /** Create a booking request for a specific trip. */
  createBooking(tripId: number, request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/${tripId}/bookings`, request);
  }

  /** Get trips published by the current user. */
  getMyTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.baseUrl}/mine`);
  }

  /** Get booking requests sent by the current user. */
  getMyBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/bookings/mine`);
  }

  /** Get bookings for a specific trip (received reservations). */
  getTripBookings(tripId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/${tripId}/bookings`);
  }

  /** Accept a booking. */
  acceptBooking(tripId: number, bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${tripId}/bookings/${bookingId}/accept`, {});
  }

  /** Reject a booking. */
  rejectBooking(tripId: number, bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${tripId}/bookings/${bookingId}/reject`, {});
  }

  /** Cancel a trip (traveler only). */
  cancelTrip(tripId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${tripId}`);
  }

  /** Cancel a booking (sender only). */
  cancelBooking(tripId: number, bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${tripId}/bookings/${bookingId}/cancel`, {});
  }
}
