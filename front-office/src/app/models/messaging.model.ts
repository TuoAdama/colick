export interface ConversationResponse {
  id: number; tripId: number; tripRoute: string;
  otherParticipantId: number; otherParticipantName: string;
  lastMessage: string | null; unreadCount: number; createdAt: string;
}
export interface MessageResponse {
  id: number; senderId: number; senderName: string;
  content: string; sentAt: string; read: boolean;
}
export interface StartConversationRequest {
  tripId: number; recipientId: number; content: string;
}
export interface SendMessageRequest { content: string; }
