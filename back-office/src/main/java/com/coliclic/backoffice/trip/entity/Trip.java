package com.coliclic.backoffice.trip.entity;

import com.coliclic.backoffice.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a trip published by a traveler who offers to carry parcels.
 */
@Entity
@Table(name = "trips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "trip_id_seq")
    @SequenceGenerator(name = "trip_id_seq", sequenceName = "trips_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User traveler;

    @Column(nullable = false)
    private String departureAddress;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private LocalDateTime arrivalTime;

    /** Maximum weight (in kg) the traveler is willing to carry. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal maxWeight;

    /** Price per kilogram in the platform's currency. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerKilo;

    /**
     * When true, booking requests are automatically accepted.
     * When false, the traveler must manually approve each request.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean instantAcceptance = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TripStatus status = TripStatus.ACTIVE;

    @Column
    private LocalDateTime createdAt;

    @PrePersist
    void setCreatedAtIfMissing() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum TripStatus {
        ACTIVE, COMPLETED, CANCELLED
    }
}
