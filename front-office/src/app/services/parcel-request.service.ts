import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CreateParcelRequestRequest, ParcelRequest } from '../models/parcel-request.model';
import { PhotoUrlService } from './photo-url.service';

export interface ParcelRequestSearchCriteria {
  departure?: string;
  destination?: string;
  date?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ParcelRequestService {
  private readonly http = inject(HttpClient);
  private readonly photoUrlService = inject(PhotoUrlService);
  private readonly baseUrl = '/api/parcel-requests';

  createRequest(request: CreateParcelRequestRequest): Observable<ParcelRequest> {
    return this.http.post<ParcelRequest>(this.baseUrl, request).pipe(
      map((parcelRequest) => this.normalizeParcelRequest(parcelRequest))
    );
  }

  getAvailableRequests(criteria: ParcelRequestSearchCriteria = {}): Observable<ParcelRequest[]> {
    let params = new HttpParams();
    if (criteria.departure?.trim()) {
      params = params.set('departure', criteria.departure.trim());
    }
    if (criteria.destination?.trim()) {
      params = params.set('destination', criteria.destination.trim());
    }
    if (criteria.date?.trim()) {
      params = params.set('date', criteria.date.trim());
    }

    return this.http.get<ParcelRequest[]>(this.baseUrl, { params }).pipe(
      map((requests) => requests.map((request) => this.normalizeParcelRequest(request)))
    );
  }

  getMyRequests(): Observable<ParcelRequest[]> {
    return this.http.get<ParcelRequest[]>(`${this.baseUrl}/mine`).pipe(
      map((requests) => requests.map((request) => this.normalizeParcelRequest(request)))
    );
  }

  closeRequest(requestId: number): Observable<ParcelRequest> {
    return this.http.put<ParcelRequest>(`${this.baseUrl}/${requestId}/close`, {}).pipe(
      map((request) => this.normalizeParcelRequest(request))
    );
  }

  cancelRequest(requestId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${requestId}`);
  }

  uploadPhoto(requestId: number, file: File): Observable<ParcelRequest> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ParcelRequest>(`${this.baseUrl}/${requestId}/photo`, formData).pipe(
      map((request) => this.normalizeParcelRequest(request))
    );
  }

  private normalizeParcelRequest(request: ParcelRequest): ParcelRequest {
    return {
      ...request,
      senderPhotoUrl: this.photoUrlService.normalizePhotoUrl(request.senderPhotoUrl),
      packagePhotoUrl: this.photoUrlService.normalizePhotoUrl(request.packagePhotoUrl),
    };
  }
}
