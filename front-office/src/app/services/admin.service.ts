import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AdminBooking, AdminDisputeDetail, AdminDisputeSummary, AdminPage, AdminPublishedTrip,
  AdminTrip, AdminTripBooking, AdminTripBookingDetail,
  AdminTripDetail, AdminTripSort, AdminUser, AdminUserDetail,
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/users';
  private readonly tripsBase = '/api/admin/trips';

  users(page = 0, q = '') {
    return this.http.get<AdminPage<AdminUser>>(this.base, { params: { page, size: 20, q } });
  }

  detail(id: number) {
    return this.http.get<AdminUserDetail>(`${this.base}/${id}`);
  }

  trips(id: number, page = 0) {
    return this.http.get<AdminPage<AdminTrip>>(`${this.base}/${id}/trips`, { params: { page, size: 20 } });
  }

  bookings(id: number, page = 0) {
    return this.http.get<AdminPage<AdminBooking>>(`${this.base}/${id}/bookings`, { params: { page, size: 20 } });
  }

  publishedTrips(page: number, sort: AdminTripSort) {
    return this.http.get<AdminPage<AdminPublishedTrip>>(this.tripsBase, {
      params: { page, size: 20, sort }, transferCache: false,
    });
  }

  tripDetail(id: number) {
    return this.http.get<AdminTripDetail>(`${this.tripsBase}/${id}`, { transferCache: false });
  }

  cancelTrip(id: number) {
    return this.http.delete<void>(`${this.tripsBase}/${id}`);
  }

  tripBookings(id: number, page: number) {
    return this.http.get<AdminPage<AdminTripBooking>>(`${this.tripsBase}/${id}/bookings`, {
      params: { page, size: 20 }, transferCache: false,
    });
  }

  tripBookingDetail(id: number, bookingId: number) {
    return this.http.get<AdminTripBookingDetail>(`${this.tripsBase}/${id}/bookings/${bookingId}`, {
      transferCache: false,
    });
  }

  tripBookingPhotoUrl(id: number, bookingId: number) {
    return `${this.tripsBase}/${id}/bookings/${bookingId}/photo`;
  }

  disputes(page: number) {
    return this.http.get<AdminPage<AdminDisputeSummary>>('/api/admin/disputes', {
      params: { page, size: 20 },
      transferCache: false,
    });
  }

  dispute(id: string) {
    return this.http.get<AdminDisputeDetail>(`/api/admin/disputes/${encodeURIComponent(id)}`, { transferCache: false });
  }
}
