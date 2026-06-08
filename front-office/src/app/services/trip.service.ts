import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Trip, CreateTripDto, UpdateTripDto } from '../models/trip.model';
import {
  CreateBookingRequest,
  BookingResponse,
  BookingSenderProfileResponse,
  ConfirmBookingDeliveryRequest,
} from '../models/booking.model';
import { PhotoUrlService } from './photo-url.service';

/**
 * Service responsible for trip search, creation, and booking operations.
 */
@Injectable({
  providedIn: 'root',
})
export class TripService {
  private readonly http = inject(HttpClient);
  private readonly photoUrlService = inject(PhotoUrlService);
  private readonly baseUrl = '/api/trips';

  private isValidNumber(value?: number | null): value is number {
    return value !== null && value !== undefined && !Number.isNaN(value);
  }

  /** Search trips by departure and destination locations. */
  searchTrips(departure: string, destination: string): Observable<Trip[]> {
    const params = new HttpParams()
      .set('departure', departure)
      .set('destination', destination);
    return this.http.get<Trip[]>(`${this.baseUrl}/search`, { params }).pipe(
      map((trips) => trips.map((trip) => this.normalizeTrip(trip)))
    );
  }

  /** Create a new trip proposal. */
  createTrip(data: CreateTripDto): Observable<Trip> {
    return this.http.post<Trip>(this.baseUrl, data).pipe(
      map((trip) => this.normalizeTrip(trip))
    );
  }

  /** Get a trip published by its identifier. */
  getTripById(tripId: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}/${tripId}`).pipe(
      map((trip) => this.normalizeTrip(trip))
    );
  }

  /** Update an existing trip proposal. */
  updateTrip(tripId: number, data: UpdateTripDto): Observable<Trip> {
    return this.http.put<Trip>(`${this.baseUrl}/${tripId}`, data).pipe(
      map((trip) => this.normalizeTrip(trip))
    );
  }

  /** Mark a trip as completed once it has been performed. */
  completeTrip(tripId: number): Observable<Trip> {
    return this.http.put<Trip>(`${this.baseUrl}/${tripId}/complete`, {}).pipe(
      map((trip) => this.normalizeTrip(trip))
    );
  }

  /** Create a booking request for a specific trip. */
  createBooking(tripId: number, request: CreateBookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/${tripId}/bookings`, request).pipe(
      map((booking) => this.normalizeBooking(booking))
    );
  }

  /** Get trips published by the current user. */
  getMyTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.baseUrl}/mine`).pipe(
      map((trips) => trips.map((trip) => this.normalizeTrip(trip)))
    );
  }

  /** Get booking requests sent by the current user. */
  getMyBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/bookings/mine`).pipe(
      map((bookings) => bookings.map((booking) => this.normalizeBooking(booking)))
    );
  }

  /** Get bookings for a specific trip (received reservations). */
  getTripBookings(tripId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.baseUrl}/${tripId}/bookings`).pipe(
      map((bookings) => bookings.map((booking) => this.normalizeBooking(booking)))
    );
  }

  /** Get sender profile data for a specific booking. */
  getBookingSenderProfile(tripId: number, bookingId: number): Observable<BookingSenderProfileResponse> {
    return this.http.get<BookingSenderProfileResponse>(`${this.baseUrl}/${tripId}/bookings/${bookingId}/sender-profile`).pipe(
      map((profile) => this.normalizeBookingSenderProfile(profile))
    );
  }

  /** Accept a booking. */
  acceptBooking(tripId: number, bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${tripId}/bookings/${bookingId}/accept`, {}).pipe(
      map((booking) => this.normalizeBooking(booking))
    );
  }

  /** Confirm parcel handoff by validating the recipient code. */
  confirmBookingDelivery(
    tripId: number,
    bookingId: number,
    request: ConfirmBookingDeliveryRequest,
  ): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${tripId}/bookings/${bookingId}/deliver`, request).pipe(
      map((booking) => this.normalizeBooking(booking))
    );
  }

  /** Reject a booking. */
  rejectBooking(tripId: number, bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${tripId}/bookings/${bookingId}/reject`, {}).pipe(
      map((booking) => this.normalizeBooking(booking))
    );
  }

  /** Remove an accepted booking (traveler only). Sends notification to sender. */
  removeBooking(tripId: number, bookingId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${tripId}/bookings/${bookingId}`);
  }

  /** Cancel a trip (traveler only). */
  cancelTrip(tripId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${tripId}`);
  }

  /** Cancel a booking (sender only). */
  cancelBooking(tripId: number, bookingId: number): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/${tripId}/bookings/${bookingId}/cancel`, {}).pipe(
      map((booking) => this.normalizeBooking(booking))
    );
  }

  private normalizeTrip(
    trip: Trip & {
      availableWeight?: number | null;
      remainingWeight?: number | null;
    }
  ): Trip {
    const normalizedAvailableWeight = this.isValidNumber(trip.availableWeight)
      ? trip.availableWeight
      : this.isValidNumber(trip.remainingWeight)
        ? trip.remainingWeight
        : this.isValidNumber(trip.maxWeight)
          ? trip.maxWeight
          : 0;

    return {
      ...trip,
      availableWeight: normalizedAvailableWeight,
      travelerPhotoUrl: this.photoUrlService.normalizePhotoUrl(trip.travelerPhotoUrl),
      travelerRatingCount: trip.travelerRatingCount ?? 0,
    };
  }

  private normalizeBooking(booking: BookingResponse): BookingResponse {
    return {
      ...booking,
      senderPhotoUrl: this.photoUrlService.normalizePhotoUrl(booking.senderPhotoUrl),
      senderRatingCount: booking.senderRatingCount ?? 0,
      packagePhotoUrl: this.photoUrlService.normalizePhotoUrl(booking.packagePhotoUrl),
    };
  }

  private normalizeBookingSenderProfile(profile: BookingSenderProfileResponse): BookingSenderProfileResponse {
    return {
      ...profile,
      reviewCount: profile.reviewCount ?? 0,
      reviews: profile.reviews ?? [],
    };
  }
}
