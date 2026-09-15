export interface ContactRequest {
  email: string;
  subject: string;
  message: string;
  category?: 'GENERAL' | 'PROFILE_REPORT';
  travelerId?: number;
  tripId?: number;
}
