/**
 * Trip model representing a trip returned by the search API.
 */
export interface Trip {
  id: number;
  travelerId: number;
  travelerName: string;
  departureAddress: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  maxWeight: number;
  pricePerKilo: number;
  instantAcceptance: boolean;
  status: string;
  availableWeight: number;
}
