package com.colick.backoffice.trip.dto;

import com.colick.backoffice.trip.entity.TravelerReview;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Read-only view returned by the token-based traveler review endpoints.
 */
@Data
@Builder
public class TravelerReviewResponse {

    private Long bookingId;
    private Long tripId;
    private Long travelerId;
    private String travelerName;
    private String travelerPhotoUrl;
    private String departureAddress;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private Integer rating;
    private String comment;
    private boolean submitted;
    private LocalDateTime submittedAt;

    public static TravelerReviewResponse from(TravelerReview review) {
        return TravelerReviewResponse.builder()
                .bookingId(review.getBooking().getId())
                .tripId(review.getBooking().getTrip().getId())
                .travelerId(review.getBooking().getTrip().getTraveler().getId())
                .travelerName(review.getBooking().getTrip().getTraveler().getFirstName()
                        + " "
                        + review.getBooking().getTrip().getTraveler().getLastName())
                .travelerPhotoUrl(review.getBooking().getTrip().getTraveler().getPhotoUrl())
                .departureAddress(review.getBooking().getTrip().getDepartureAddress())
                .destination(review.getBooking().getTrip().getDestination())
                .departureTime(review.getBooking().getTrip().getDepartureTime())
                .arrivalTime(review.getBooking().getTrip().getArrivalTime())
                .rating(review.getRating())
                .comment(review.getComment())
                .submitted(review.isSubmitted())
                .submittedAt(review.getSubmittedAt())
                .build();
    }
}
