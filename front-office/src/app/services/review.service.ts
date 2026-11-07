import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  ReviewAccessResponse,
  ReviewSubmissionRequest,
  ReviewSubmissionResponse,
} from '../models/review.model';
import { PhotoUrlService } from './photo-url.service';

interface TravelerReviewApiResponse {
  bookingId: number;
  tripId: number;
  travelerId: number;
  travelerName: string;
  travelerPhotoUrl?: string;
  departureAddress: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  rating?: number | null;
  comment?: string | null;
  submitted: boolean;
  submittedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly photoUrlService = inject(PhotoUrlService);
  private readonly baseUrl = '/api/traveler-reviews';

  getReviewAccess(token: string): Observable<ReviewAccessResponse> {
    return this.http.get<TravelerReviewApiResponse>(this.baseUrl, {
      params: { token },
    }).pipe(
      map((reviewAccess) => this.mapReviewAccess(reviewAccess))
    );
  }

  submitReview(
    token: string,
    request: ReviewSubmissionRequest,
  ): Observable<ReviewSubmissionResponse> {
    return this.http.post<TravelerReviewApiResponse>(this.baseUrl, request, {
      params: { token },
    }).pipe(
      map((review) => this.mapReviewSubmission(review))
    );
  }

  private mapReviewAccess(reviewAccess: TravelerReviewApiResponse): ReviewAccessResponse {
    const existingReview = reviewAccess.submitted && reviewAccess.rating
      ? {
          bookingId: reviewAccess.bookingId,
          rating: reviewAccess.rating,
          comment: reviewAccess.comment,
          createdAt: reviewAccess.submittedAt ?? undefined,
        }
      : null;

    return {
      ...reviewAccess,
      travelerPhotoUrl: this.photoUrlService.normalizePhotoUrl(reviewAccess.travelerPhotoUrl),
      reviewSubmitted: reviewAccess.submitted,
      existingReview,
    };
  }

  private mapReviewSubmission(review: TravelerReviewApiResponse): ReviewSubmissionResponse {
    return {
      bookingId: review.bookingId,
      rating: review.rating ?? 0,
      comment: review.comment,
      createdAt: review.submittedAt ?? undefined,
    };
  }
}
