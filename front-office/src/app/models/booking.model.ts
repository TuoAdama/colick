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

export interface BookingResponse {
  id: number;
  tripId: number;
  senderId: number;
  senderName: string;
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
}
