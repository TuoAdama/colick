package com.colick.backoffice.messaging.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Read-only view of a conversation returned by the API.
 */
@Data
@Builder
public class ConversationResponse {

    private Long id;
    private Long tripId;

    /** Human-readable route, e.g. "Paris → Abidjan". */
    private String tripRoute;

    /** Conversation context type. Kept separate from trip fields for backward compatibility. */
    private String contextType;
    private Long contextId;
    private String contextRoute;

    private Long otherParticipantId;
    private String otherParticipantName;

    /** Preview of the last message in the conversation, or null if no messages yet. */
    private String lastMessage;

    /** Number of unread messages from the other participant. */
    private long unreadCount;

    private LocalDateTime createdAt;
}
