package com.colick.backoffice.messaging.entity;

import com.colick.backoffice.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents a single message inside a {@link Conversation}.
 */
@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean read = false;

    @PrePersist
    protected void onCreate() {
        this.sentAt = LocalDateTime.now();
    }
}
