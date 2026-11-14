package com.coliclic.backoffice.trip.dto;

import com.coliclic.backoffice.trip.entity.TravelerReview;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Read-only review item shown on a sender public profile.
 */
@Data
@Builder
public class TripBookingSenderReviewResponse {

    private String reviewerName;
    private Integer rating;
    private String comment;
    private LocalDateTime submittedAt;

    public static TripBookingSenderReviewResponse from(TravelerReview review) {
        return TripBookingSenderReviewResponse.builder()
                .reviewerName(review.getBooking().getSender().getFirstName()
                        + " "
                        + review.getBooking().getSender().getLastName())
                .rating(review.getRating())
                .comment(review.getComment())
                .submittedAt(review.getSubmittedAt())
                .build();
    }
}
