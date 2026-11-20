import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactRequest } from '../models/contact.model';

export interface DisputeRequest {
  email: string;
  description: string;
  tripReference?: string;
  bookingReference?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  send(request: ContactRequest): Observable<void> {
    return this.http.post<void>('/api/contact', request);
  }

  submitDispute(request: DisputeRequest): Observable<void> {
    return this.http.post<void>('/api/disputes', request);
  }
}
