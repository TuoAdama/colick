import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReviewPageComponent } from './review-page.component';
import { ReviewService } from '../../services/review.service';

describe('ReviewPageComponent', () => {
  let fixture: ComponentFixture<ReviewPageComponent>;
  let component: ReviewPageComponent;

  const reviewServiceMock = {
    getReviewAccess: jasmine.createSpy('getReviewAccess').and.returnValue(of({
      bookingId: 18,
      tripId: 7,
      travelerId: 4,
      travelerName: 'Alice Martin',
      travelerPhotoUrl: '/api/uploads/traveler.png',
      departureAddress: 'Paris',
      destination: 'Abidjan',
      departureTime: '2025-03-02T08:00:00Z',
      arrivalTime: '2025-03-02T16:00:00Z',
      reviewSubmitted: false,
      existingReview: null,
    })),
    submitReview: jasmine.createSpy('submitReview').and.returnValue(of({
      reviewId: 3,
      bookingId: 18,
      rating: 5,
      comment: 'Great trip',
      createdAt: '2025-03-03T10:15:00Z',
    })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ token: 'secure-token' }),
            },
          },
        },
        { provide: ReviewService, useValue: reviewServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewPageComponent);
    component = fixture.componentInstance;
    reviewServiceMock.getReviewAccess.calls.reset();
    reviewServiceMock.submitReview.calls.reset();
    reviewServiceMock.getReviewAccess.and.returnValue(of({
      bookingId: 18,
      tripId: 7,
      travelerId: 4,
      travelerName: 'Alice Martin',
      travelerPhotoUrl: '/api/uploads/traveler.png',
      departureAddress: 'Paris',
      destination: 'Abidjan',
      departureTime: '2025-03-02T08:00:00Z',
      arrivalTime: '2025-03-02T16:00:00Z',
      reviewSubmitted: false,
      existingReview: null,
    }));
    reviewServiceMock.submitReview.and.returnValue(of({
      reviewId: 3,
      bookingId: 18,
      rating: 5,
      comment: 'Great trip',
      createdAt: '2025-03-03T10:15:00Z',
    }));
  });

  it('loads the review context from the token on init', () => {
    fixture.detectChanges();

    expect(reviewServiceMock.getReviewAccess).toHaveBeenCalledOnceWith('secure-token');
    expect(component.loadState).toBe('ready');
    expect(component.reviewAccess?.travelerName).toBe('Alice Martin');
  });

  it('shows an error state when the token is missing', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ReviewPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        { provide: ReviewService, useValue: reviewServiceMock },
      ],
    }).compileComponents();

    const localFixture = TestBed.createComponent(ReviewPageComponent);
    const localComponent = localFixture.componentInstance;

    localFixture.detectChanges();

    expect(localComponent.loadState).toBe('error');
    expect(localComponent.errorMessage).toContain('invalid');
    expect(reviewServiceMock.getReviewAccess).not.toHaveBeenCalled();
  });

  it('submits a valid review and locks the form afterwards', () => {
    fixture.detectChanges();
    component.setRating(5);
    component.reviewForm.controls.comment.setValue('  Great trip  ');

    component.onSubmit();

    expect(reviewServiceMock.submitReview).toHaveBeenCalledWith('secure-token', {
      rating: 5,
      comment: 'Great trip',
    });
    expect(component.successMessage).toContain('Thank you');
    expect(component.hasExistingReview).toBeTrue();
    expect(component.reviewForm.disabled).toBeTrue();
  });

  it('does not submit when a final review already exists', () => {
    reviewServiceMock.getReviewAccess.and.returnValue(of({
      bookingId: 18,
      tripId: 7,
      travelerId: 4,
      travelerName: 'Alice Martin',
      travelerPhotoUrl: '/api/uploads/traveler.png',
      departureAddress: 'Paris',
      destination: 'Abidjan',
      departureTime: '2025-03-02T08:00:00Z',
      arrivalTime: '2025-03-02T16:00:00Z',
      reviewSubmitted: true,
      existingReview: {
        bookingId: 18,
        rating: 4,
        comment: 'Already submitted',
      },
    }));

    fixture.detectChanges();
    component.onSubmit();

    expect(reviewServiceMock.submitReview).not.toHaveBeenCalled();
    expect(component.reviewForm.disabled).toBeTrue();
  });

  it('surfaces loading errors from the review link lookup', () => {
    reviewServiceMock.getReviewAccess.and.returnValue(
      throwError(() => ({ error: { message: 'Expired token' } }))
    );

    fixture.detectChanges();

    expect(component.loadState).toBe('error');
    expect(component.errorMessage).toBe('Expired token');
  });
});
