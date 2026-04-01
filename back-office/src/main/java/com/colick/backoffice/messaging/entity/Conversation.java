package com.colick.backoffice.messaging.entity;

import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents a chat conversation between two users about a specific trip.
 */
@Entity
@Table(name = "conversations",
       uniqueConstraints = @UniqueConstraint(
               columnNames = {"trip_id", "participant1_id", "participant2_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant1_id", nullable = false)
    private User participant1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant2_id", nullable = false)
    private User participant2;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
