package com.colick.backoffice.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for starting a new conversation (or sending the first message
 * in an existing conversation for the same trip and participants).
 */
@Data
public class StartConversationRequest {

    /** ID of the trip this conversation is about. */
    @NotNull(message = "Trip ID is required")
    private Long tripId;

    /** ID of the other participant (recipient). */
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    /** Content of the first message. */
    @NotBlank(message = "Message content is required")
    private String content;
}
