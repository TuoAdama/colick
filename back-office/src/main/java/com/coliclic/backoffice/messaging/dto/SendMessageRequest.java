package com.coliclic.backoffice.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for sending a message in an existing conversation.
 */
@Data
public class SendMessageRequest {

    /** Content of the message. */
    @NotBlank
    private String content;
}
