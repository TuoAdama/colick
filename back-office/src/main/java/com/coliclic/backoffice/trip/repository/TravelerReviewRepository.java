package com.coliclic.backoffice.trip.repository;

import com.coliclic.backoffice.trip.entity.TravelerReview;
import com.coliclic.backoffice.trip.entity.TripBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link TravelerReview} entities.
 */
@Repository
public interface TravelerReviewRepository extends JpaRepository<TravelerReview, Long> {

    @Query("""
            SELECT review
            FROM TravelerReview review
            JOIN FETCH review.booking booking
            JOIN FETCH booking.trip trip
            JOIN FETCH trip.traveler traveler
            WHERE review.tokenHash = :tokenHash
            """)
    Optional<TravelerReview> findByTokenHashWithAssociations(@Param("tokenHash") String tokenHash);

    List<TravelerReview> findByBookingIn(Collection<TripBooking> bookings);

    @Query("""
            SELECT booking.trip.traveler.id AS travelerId,
                   AVG(review.rating) AS averageRating,
                   COUNT(review.id) AS reviewCount
            FROM TravelerReview review
            JOIN review.booking booking
            WHERE review.submittedAt IS NOT NULL
              AND booking.trip.traveler.id IN :travelerIds
            GROUP BY booking.trip.traveler.id
            """)
    List<TravelerRatingStatsProjection> findRatingStatsByTravelerIds(@Param("travelerIds") Collection<Long> travelerIds);

    @Query("""
            SELECT review
            FROM TravelerReview review
            JOIN FETCH review.booking booking
            JOIN FETCH booking.sender sender
            JOIN FETCH booking.trip trip
            WHERE review.submittedAt IS NOT NULL
              AND trip.traveler.id = :travelerId
            ORDER BY review.submittedAt DESC
            """)
    List<TravelerReview> findSubmittedReviewsByTravelerId(@Param("travelerId") Long travelerId);

    interface TravelerRatingStatsProjection {
        Long getTravelerId();
        Double getAverageRating();
        long getReviewCount();
    }
}
