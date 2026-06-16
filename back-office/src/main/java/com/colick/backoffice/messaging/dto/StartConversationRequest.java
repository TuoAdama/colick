package com.colick.backoffice.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import lombok.Data;

/**
 * Request body for starting a new conversation (or sending the first message
 * in an existing conversation for the same trip and participants).
 */
@Data
public class StartConversationRequest {

    /** ID of the trip this conversation is about. */
    private Long tripId;

    /** ID of the parcel request this conversation is about. */
    private Long parcelRequestId;

    /** ID of the other participant (recipient). */
    @NotNull
    private Long recipientId;

    /** Content of the first message. */
    @NotBlank
    private String content;

    @AssertTrue(message = "exactly one of tripId or parcelRequestId is required")
    public boolean hasExactlyOneContext() {
        return (tripId == null) != (parcelRequestId == null);
    }
}
