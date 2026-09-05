export interface CreateBookingRequest {
  title: string;
  weight: number;
  description?: string;
  packagePhotoUrl?: string;
  recipientContact: string;
}

export interface ConfirmBookingDeliveryRequest {
  validationCode: string;
}

export interface BookingSenderReviewResponse {
  reviewerName: string;
  rating: number;
  comment?: string | null;
  submittedAt?: string;
}

export interface BookingSenderProfileResponse {
  completedTripCount: number;
  sentPackageCount: number;
  averageRating?: number | null;
  reviewCount: number;
  reviews: BookingSenderReviewResponse[];
}

export interface BookingResponse {
  id: number;
  tripId: number;
  senderId: number;
  senderName: string;
  senderPhotoUrl?: string;
  senderRatingAverage?: number | null;
  senderRatingCount?: number;
  title: string;
  weight: number;
  description?: string;
  packagePhotoUrl?: string;
  recipientContact: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'REMOVED';
  validationDeliveryChannel?: 'EMAIL' | 'SMS';
  validationDeliveryStatus?: 'DELIVERED' | 'FAILED' | 'INVALIDATED';
  validationCodeSentAt?: string;
  validationCodeInvalidatedAt?: string;
  validationCodeDeliveryFailedAt?: string;
  deliveredAt?: string;
  validationCodeActive: boolean;
  createdAt?: string;
}
