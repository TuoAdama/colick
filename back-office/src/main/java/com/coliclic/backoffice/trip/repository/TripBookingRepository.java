package com.coliclic.backoffice.trip.repository;

import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link TripBooking} entities.
 */
@Repository
public interface TripBookingRepository extends JpaRepository<TripBooking, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "trip")
    @Query("select item from TripBooking item where item.sender.id = :userId "
            + "order by case when item.createdAt is null then 1 else 0 end, item.createdAt desc, item.id desc")
    Page<TripBooking> findAdminHistory(
            @Param("userId") Long userId,
            Pageable pageable);

    List<TripBooking> findByTrip(Trip trip);

    List<TripBooking> findByTripAndStatus(Trip trip, TripBooking.BookingStatus status);

    List<TripBooking> findByTripAndStatusIn(Trip trip, List<TripBooking.BookingStatus> statuses);

    boolean existsByTripAndStatus(Trip trip, TripBooking.BookingStatus status);

    boolean existsByTripAndSenderAndStatusIn(Trip trip, User sender, List<TripBooking.BookingStatus> statuses);

    /** Returns all booking requests submitted by the given user. */
    List<TripBooking> findBySender(User sender);

    long countBySender(User sender);

    Optional<TripBooking> findFirstBySenderAndCreatedAtIsNotNullOrderByCreatedAtAsc(User sender);

    @Query("SELECT booking FROM TripBooking booking "
            + "WHERE booking.commercialMode IS NULL OR booking.platformFeeRate IS NULL")
    List<TripBooking> findBookingsMissingCommercialTerms();
}
