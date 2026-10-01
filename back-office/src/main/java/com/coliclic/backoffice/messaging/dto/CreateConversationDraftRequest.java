package com.coliclic.backoffice.messaging.dto;

import jakarta.validation.constraints.AssertTrue;
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
    @Positive
    private Long tripId;

    /** ID of the parcel request this conversation is about. */
    @Positive
    private Long parcelRequestId;

    /** ID of the other participant (recipient). */
    @NotNull
    @Positive
    private Long recipientId;

    @AssertTrue(message = "exactly one of tripId or parcelRequestId is required")
    public boolean hasExactlyOneContext() {
        return (tripId == null) != (parcelRequestId == null);
    }
}
