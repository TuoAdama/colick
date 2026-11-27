package com.coliclic.backoffice.trip.service;

import com.coliclic.backoffice.trip.dto.SubmitTravelerReviewRequest;
import com.coliclic.backoffice.trip.dto.TravelerReviewResponse;
import com.coliclic.backoffice.trip.dto.TripBookingSenderReviewResponse;
import com.coliclic.backoffice.trip.entity.Trip;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Service handling traveler review invitations, submissions and public aggregates.
 */
public interface TravelerReviewService {

    /** Creates missing review invitations for accepted bookings on the given trip. */
    void createReviewInvitations(Trip trip);

    /** Returns the review invitation identified by the provided raw token. */
    TravelerReviewResponse getReviewByToken(String rawToken);

    /** Submits the final review associated with the provided raw token. */
    TravelerReviewResponse submitReview(String rawToken, SubmitTravelerReviewRequest request);

    /** Returns aggregated rating summaries keyed by traveler identifier. */
    Map<Long, TravelerRatingSummary> getTravelerRatingSummaries(Collection<Long> travelerIds);

    /** Returns submitted reviews for a traveler, ordered from newest to oldest. */
    List<TripBookingSenderReviewResponse> getSubmittedReviewsForTraveler(Long travelerId);
}
