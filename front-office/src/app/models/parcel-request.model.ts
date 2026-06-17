export type ParcelRequestStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';

export interface CreateParcelRequestRequest {
  departure: string;
  destination: string;
  desiredDate?: string;
  packageTitle: string;
  weight: number;
  description?: string;
  packagePhotoUrl?: string;
}

export interface ParcelRequest {
  id: number;
  senderId: number;
  senderName: string;
  senderPhotoUrl?: string;
  departure: string;
  destination: string;
  desiredDate?: string;
  packageTitle: string;
  weight: number;
  description?: string;
  packagePhotoUrl?: string;
  status: ParcelRequestStatus;
  createdAt?: string;
  updatedAt?: string;
}
