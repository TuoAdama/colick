import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTripAlertRequest, TripAlert } from '../models/trip-alert.model';

@Injectable({
  providedIn: 'root',
})
export class TripAlertService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/trip-alerts';

  createAlert(request: CreateTripAlertRequest): Observable<TripAlert> {
    return this.http.post<TripAlert>(this.baseUrl, request);
  }

  getMyAlerts(): Observable<TripAlert[]> {
    return this.http.get<TripAlert[]>(`${this.baseUrl}/mine`);
  }

  deleteAlert(alertId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${alertId}`);
  }
}
