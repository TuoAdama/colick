package com.colick.backoffice.trip.service;

/**
 * Aggregated public rating summary for a traveler.
 *
 * @param averageRating average submitted rating, or {@code null} when none exists
 * @param reviewCount number of submitted reviews
 */
public record TravelerRatingSummary(Double averageRating, long reviewCount) {
}
