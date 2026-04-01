package com.colick.backoffice.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for sending a message in an existing conversation.
 */
@Data
public class SendMessageRequest {

    /** Content of the message. */
    @NotBlank(message = "Message content is required")
    private String content;
}
