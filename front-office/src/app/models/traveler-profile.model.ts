export interface TravelerProfile {
  travelerId: number;
  displayName: string;
  photoUrl?: string | null;
  emailVerified: boolean;
  memberSince?: string | null;
  memberSinceEstimated: boolean;
  completedTripCount: number;
  averageRating?: number | null;
  reviewCount: number;
  responseRatePercent?: number | null;
  averageResponseTimeMinutes?: number | null;
  responseSampleSize: number;
}

export interface PublicTravelerReview {
  id: number;
  reviewerDisplayName: string;
  rating: number;
  comment?: string | null;
  submittedAt: string;
}

export interface TravelerReviewsPage {
  content: PublicTravelerReview[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
