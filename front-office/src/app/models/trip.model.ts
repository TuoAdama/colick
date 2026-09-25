/**
 * DTO used when creating a new trip via POST /api/trips.
 */
export interface CreateTripDto {
  departureAddress: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  maxWeight: number;
  pricePerKilo: number;
  instantAcceptance: boolean;
}

/**
 * DTO used when updating an existing trip via PUT /api/trips/:id.
 * The edit form reuses the exact same payload as creation.
 */
export type UpdateTripDto = CreateTripDto;

/**
 * Trip model representing a trip returned by the search API.
 */
export interface Trip {
  id: number;
  reference?: string;
  travelerId: number;
  travelerName: string;
  travelerPhotoUrl?: string;
  travelerRatingAverage?: number | null;
  travelerRatingCount?: number;
  departureAddress: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  maxWeight: number;
  pricePerKilo: number;
  instantAcceptance: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt?: string;
  availableWeight: number;
}
