export interface CreateTripAlertRequest {
  departure: string;
  destination: string;
  date?: string;
  sort?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface TripAlert {
  id: number;
  departure: string;
  destination: string;
  date?: string;
  sort?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  createdAt?: string;
  alreadyExists?: boolean;
}
