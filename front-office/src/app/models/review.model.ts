export interface ReviewSubmissionRequest {
  rating: number;
  comment?: string;
}

export interface SubmittedReview {
  id?: number;
  bookingId: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
}

export interface ReviewAccessResponse {
  bookingId: number;
  tripId: number;
  travelerId: number;
  travelerName: string;
  travelerPhotoUrl?: string;
  departureAddress: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  reviewSubmitted: boolean;
  existingReview?: SubmittedReview | null;
}

export interface ReviewSubmissionResponse {
  reviewId?: number;
  bookingId: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
}
