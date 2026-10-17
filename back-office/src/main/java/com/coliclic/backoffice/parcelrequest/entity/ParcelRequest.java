package com.coliclic.backoffice.parcelrequest.entity;

import com.coliclic.backoffice.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "parcel_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParcelRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false)
    private String departure;

    @Column(nullable = false)
    private String normalizedDeparture;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String normalizedDestination;

    @Column
    private LocalDate desiredDate;

    @Column(nullable = false)
    private String packageTitle;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal weight;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private String packagePhotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ParcelRequestStatus status = ParcelRequestStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ParcelRequestStatus {
        ACTIVE, CLOSED, CANCELLED
    }
}
