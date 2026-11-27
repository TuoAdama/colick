export interface ContactRequest {
  email: string;
  subject: string;
  message: string;
  turnstileToken: string;
  category?: 'GENERAL' | 'PROFILE_REPORT';
  travelerId?: number;
  tripId?: number;
}
