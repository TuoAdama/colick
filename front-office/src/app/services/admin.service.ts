import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminBooking, AdminPage, AdminTrip, AdminUser, AdminUserDetail } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin/users';

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
}
