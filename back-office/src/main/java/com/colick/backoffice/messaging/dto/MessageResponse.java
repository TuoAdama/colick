package com.colick.backoffice.messaging.dto;

import com.colick.backoffice.messaging.entity.Message;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Read-only view of a message returned by the API.
 */
@Data
@Builder
public class MessageResponse {

    private Long id;
    private Long senderId;
    private String senderName;
    private String content;
    private LocalDateTime sentAt;
    private boolean read;

    /**
     * Maps a {@link Message} entity to a {@link MessageResponse} DTO.
     *
     * @param message the message entity
     * @return the DTO
     */
    public static MessageResponse from(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFirstName() + " " + message.getSender().getLastName())
                .content(message.getContent())
                .sentAt(message.getSentAt())
                .read(message.isRead())
                .build();
    }
}
