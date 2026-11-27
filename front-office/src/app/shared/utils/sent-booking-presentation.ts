import { BookingResponse } from '../../models/booking.model';

export function sentBookingStatusLabel(status: BookingResponse['status']): string {
  return ({
    PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée',
    CANCELLED: 'Annulée', REMOVED: 'Retirée',
  })[status];
}

export function routeCity(location: string): string {
  return location.split(',')[0]?.trim() || location;
}

export function routeCountry(location: string): string {
  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts.at(-1)! : '';
}
