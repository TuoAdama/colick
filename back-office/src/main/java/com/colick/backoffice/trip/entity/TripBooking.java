package com.colick.backoffice.trip.entity;

import com.colick.backoffice.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Represents a booking request made by a sender for a specific trip.
 */
@Entity
@Table(name = "trip_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    /** Title / name of the package. */
    @Column(nullable = false)
    private String title;

    /** Weight of the parcel in kg. */
    @Column(precision = 10, scale = 2)
    private BigDecimal weight;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Optional URL to the parcel photo. */
    @Column
    private String packagePhotoUrl;

    /** Contact information of the person who will pick up the package. */
    @Column(nullable = false)
    private String recipientContact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(length = 6)
    private String validationCode;

    @Enumerated(EnumType.STRING)
    @Column
    private ValidationDeliveryChannel validationDeliveryChannel;

    @Column
    private LocalDateTime validationCodeSentAt;

    @Column
    private LocalDateTime validationCodeInvalidatedAt;

    public boolean hasActiveValidationCode() {
        return validationCode != null && validationCodeInvalidatedAt == null;
    }

    public enum BookingStatus {
        PENDING, ACCEPTED, REJECTED, CANCELLED
    }

    public enum ValidationDeliveryChannel {
        EMAIL, SMS
    }
}
