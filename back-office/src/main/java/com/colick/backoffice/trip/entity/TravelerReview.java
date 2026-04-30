package com.colick.backoffice.trip.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.Check;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Represents a single final traveler review associated with one accepted booking.
 * <p>
 * A review row is created when the trip is completed and acts as both the invitation
 * holder (through its token hash) and the persisted review once submitted.
 * </p>
 */
@Entity
@Table(
        name = "traveler_reviews",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_traveler_review_booking", columnNames = "booking_id"),
                @UniqueConstraint(name = "uk_traveler_review_token_hash", columnNames = "token_hash")
        }
)
@Check(constraints = "(rating IS NULL AND submitted_at IS NULL) OR (rating BETWEEN 1 AND 5 AND submitted_at IS NOT NULL)")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelerReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private TripBooking booking;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private LocalDateTime invitedAt;

    @Min(1)
    @Max(5)
    @Column
    private Integer rating;

    @Size(max = 1000)
    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column
    private LocalDateTime submittedAt;

    public boolean isSubmitted() {
        return submittedAt != null;
    }

    public void submit(int rating, String comment, LocalDateTime submissionTime) {
        if (isSubmitted()) {
            throw new IllegalStateException("A final review has already been submitted for this booking");
        }
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        this.rating = rating;
        this.comment = normalizeComment(comment);
        this.submittedAt = Objects.requireNonNull(submissionTime, "submissionTime must not be null");
    }

    private String normalizeComment(String rawComment) {
        if (rawComment == null) {
            return null;
        }

        String trimmedComment = rawComment.trim();
        return trimmedComment.isEmpty() ? null : trimmedComment;
    }
}
