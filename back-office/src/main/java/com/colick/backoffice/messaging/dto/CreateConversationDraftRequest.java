package com.colick.backoffice.messaging.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * Request body for creating a conversation without sending a message.
 * Used when a user wants to open a messaging thread before composing.
 */
@Data
public class CreateConversationDraftRequest {

    /** ID of the trip this conversation is about. */
    @NotNull
    @Positive
    private Long tripId;

    /** ID of the other participant (recipient). */
    @NotNull
    @Positive
    private Long recipientId;
}
