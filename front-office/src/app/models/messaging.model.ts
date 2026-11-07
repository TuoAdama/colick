export interface ConversationResponse {
  id: number; tripId?: number | null; tripRoute?: string | null;
  contextType?: 'TRIP' | 'PARCEL_REQUEST'; contextId?: number; contextRoute?: string;
  otherParticipantId: number; otherParticipantName: string;
  lastMessage: string | null; unreadCount: number; createdAt: string;
}
export interface MessageResponse {
  id: number; senderId: number; senderName: string;
  content: string; sentAt: string; read: boolean;
}
export interface StartConversationRequest {
  tripId?: number; parcelRequestId?: number; recipientId: number; content: string;
}
export interface CreateConversationDraftRequest {
  tripId?: number; parcelRequestId?: number; recipientId: number;
}
export interface SendMessageRequest { content: string; }
