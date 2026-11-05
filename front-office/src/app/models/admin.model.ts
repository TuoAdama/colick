export interface AdminPage<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: string;
  createdAtEstimated: boolean;
  updatedAt?: string;
  connectionMethods: ('GOOGLE' | 'PASSWORD')[];
  verified: boolean;
}

export interface AdminUserDetail {
  user: AdminUser;
  tripsCount: number;
  bookingsCount: number;
}

export interface AdminTrip {
  id: number;
  reference: string;
  departureAddress: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  maxWeight: number;
  pricePerKilo: number;
  status: string;
}

export interface AdminBooking {
  id: number;
  title: string;
  tripId: number;
  tripReference: string;
  departureAddress: string;
  destination: string;
  createdAt?: string;
  weight?: number;
  status: string;
}
