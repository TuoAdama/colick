package com.colick.backoffice.trip.service;

import com.colick.backoffice.trip.dto.SubmitTravelerReviewRequest;
import com.colick.backoffice.trip.dto.TravelerReviewResponse;
import com.colick.backoffice.trip.entity.Trip;

import java.util.Collection;
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
}
