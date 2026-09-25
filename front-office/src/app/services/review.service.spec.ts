import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads review access data from the secure token link', () => {
    service.getReviewAccess('secure-token').subscribe((response) => {
      expect(response.travelerPhotoUrl).toBe('/api/uploads/traveler.png');
      expect(response.reviewSubmitted).toBeFalse();
    });

    const req = httpMock.expectOne('/api/traveler-reviews?token=secure-token');
    expect(req.request.method).toBe('GET');
    req.flush({
      bookingId: 18,
      tripId: 7,
      travelerId: 4,
      travelerName: 'Alice Martin',
      travelerPhotoUrl: '/uploads/traveler.png',
      departureAddress: 'Paris',
      destination: 'Abidjan',
      departureTime: '2025-03-02T08:00:00Z',
      arrivalTime: '2025-03-02T16:00:00Z',
      submitted: false,
      rating: null,
      comment: null,
      submittedAt: null,
    });
  });

  it('submits a review with the secure token payload', () => {
    service.submitReview('secure-token', { rating: 5, comment: 'Great trip' }).subscribe((response) => {
      expect(response.bookingId).toBe(18);
      expect(response.rating).toBe(5);
      expect(response.comment).toBe('Great trip');
      expect(response.createdAt).toBe('2025-03-03T10:15:00Z');
    });

    const req = httpMock.expectOne('/api/traveler-reviews?token=secure-token');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      rating: 5,
      comment: 'Great trip',
    });
    req.flush({
      bookingId: 18,
      tripId: 7,
      travelerId: 4,
      travelerName: 'Alice Martin',
      travelerPhotoUrl: '/uploads/traveler.png',
      departureAddress: 'Paris',
      destination: 'Abidjan',
      departureTime: '2025-03-02T08:00:00Z',
      arrivalTime: '2025-03-02T16:00:00Z',
      rating: 5,
      comment: 'Great trip',
      submitted: true,
      submittedAt: '2025-03-03T10:15:00Z',
    });
  });
});
