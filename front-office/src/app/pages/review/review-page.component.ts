import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReviewAccessResponse, ReviewSubmissionResponse } from '../../models/review.model';
import { ReviewService } from '../../services/review.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

type ReviewLoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-review-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UserAvatarComponent],
  templateUrl: './review-page.component.html',
})
export class ReviewPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly reviewService = inject(ReviewService);

  readonly ratingOptions = [1, 2, 3, 4, 5];
  readonly maxCommentLength = 500;

  readonly reviewForm = this.fb.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.maxLength(this.maxCommentLength)]],
  });

  loadState: ReviewLoadState = 'loading';
  reviewAccess: ReviewAccessResponse | null = null;
  errorMessage = '';
  submitErrorMessage = '';
  successMessage = '';
  isSubmitting = false;

  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';
    if (!this.token) {
      this.loadState = 'error';
      this.errorMessage = 'This review link is invalid or incomplete.';
      return;
    }

    this.loadReviewAccess();
  }

  get selectedRating(): number {
    return this.reviewForm.controls.rating.value;
  }

  get remainingCommentCharacters(): number {
    return this.maxCommentLength - this.reviewForm.controls.comment.value.length;
  }

  get hasExistingReview(): boolean {
    return !!this.reviewAccess?.reviewSubmitted;
  }

  formatDisplayDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  setRating(rating: number): void {
    if (this.hasExistingReview || this.isSubmitting) {
      return;
    }

    this.reviewForm.controls.rating.setValue(rating);
    this.reviewForm.controls.rating.markAsTouched();
  }

  onSubmit(): void {
    if (!this.token || this.hasExistingReview || this.isSubmitting) {
      return;
    }

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitErrorMessage = '';

    const rawComment = this.reviewForm.controls.comment.value.trim();

    this.reviewService.submitReview(this.token, {
      rating: this.reviewForm.controls.rating.value,
      comment: rawComment || undefined,
    }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Thank you! Your review has been recorded.';
        this.applySubmittedReview(response);
      },
      error: (error: { error?: { message?: string } }) => {
        this.isSubmitting = false;
        this.submitErrorMessage =
          error.error?.message ?? 'We could not submit your review. Please try again later.';
      },
    });
  }

  private loadReviewAccess(): void {
    this.reviewService.getReviewAccess(this.token).subscribe({
      next: (reviewAccess) => {
        this.reviewAccess = reviewAccess;
        this.loadState = 'ready';
        this.successMessage = '';
        this.submitErrorMessage = '';

        if (reviewAccess.reviewSubmitted) {
        this.reviewForm.setValue({
          rating: reviewAccess.existingReview?.rating ?? 0,
          comment: reviewAccess.existingReview?.comment ?? '',
        });
          this.reviewForm.disable();
          return;
        }

        this.reviewForm.enable();
        this.reviewForm.reset({ rating: 0, comment: '' });
      },
      error: (error: { error?: { message?: string } }) => {
        this.loadState = 'error';
        this.errorMessage =
          error.error?.message ?? 'We could not validate this review link.';
      },
    });
  }

  private applySubmittedReview(response: ReviewSubmissionResponse): void {
    if (!this.reviewAccess) {
      return;
    }

    this.reviewAccess = {
      ...this.reviewAccess,
      reviewSubmitted: true,
      existingReview: {
        id: response.reviewId,
        bookingId: response.bookingId,
        rating: response.rating,
        comment: response.comment,
        createdAt: response.createdAt,
      },
    };

    this.reviewForm.setValue({
      rating: response.rating,
      comment: response.comment ?? '',
    });
    this.reviewForm.disable();
  }
}
