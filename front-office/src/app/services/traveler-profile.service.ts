import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { TravelerProfile, TravelerReviewsPage } from '../models/traveler-profile.model';
import { PhotoUrlService } from './photo-url.service';

@Injectable({ providedIn: 'root' })
export class TravelerProfileService {
  private readonly http = inject(HttpClient);
  private readonly photos = inject(PhotoUrlService);

  getProfile(id: number): Observable<TravelerProfile> {
    return this.http.get<TravelerProfile>(`/api/travelers/${id}/profile`).pipe(
      map(profile => ({ ...profile, photoUrl: this.photos.normalizePhotoUrl(profile.photoUrl) }))
    );
  }

  getReviews(id: number, page = 0, size = 10): Observable<TravelerReviewsPage> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<TravelerReviewsPage>(`/api/travelers/${id}/reviews`, { params });
  }
}
