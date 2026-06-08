package com.colick.backoffice.trip.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Aggregated sender profile data for a booking context.
 */
@Data
@Builder
public class TripBookingSenderProfileResponse {

    private Long completedTripCount;
    private Long sentPackageCount;
    private Double averageRating;
    private Long reviewCount;
    private List<TripBookingSenderReviewResponse> reviews;
}
