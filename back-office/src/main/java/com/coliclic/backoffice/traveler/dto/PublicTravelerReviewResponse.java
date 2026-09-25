package com.coliclic.backoffice.traveler.dto;

import com.coliclic.backoffice.trip.entity.TravelerReview;
import java.time.LocalDateTime;

public record PublicTravelerReviewResponse(
        Long id,
        String reviewerDisplayName,
        int rating,
        String comment,
        LocalDateTime submittedAt
) {
    public static PublicTravelerReviewResponse from(TravelerReview review) {
        String firstName = review.getBooking().getSender().getFirstName();
        String lastName = review.getBooking().getSender().getLastName();
        String displayName = firstName + (lastName == null || lastName.isBlank() ? "" : " " + lastName.trim().charAt(0) + ".");
        return new PublicTravelerReviewResponse(
                review.getId(), displayName, review.getRating(), review.getComment(), review.getSubmittedAt());
    }
}
