export interface CreateBookingRequest {
  title: string;
  weight: number;
  description?: string;
  packagePhotoUrl?: string;
  recipientContact: string;
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
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  validationDeliveryChannel?: 'EMAIL' | 'SMS';
  validationCodeSentAt?: string;
  validationCodeInvalidatedAt?: string;
  validationCodeActive: boolean;
}
