package com.colick.backoffice.trip.repository;

import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.entity.TripBooking;
import com.colick.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * JPA repository for {@link TripBooking} entities.
 */
@Repository
public interface TripBookingRepository extends JpaRepository<TripBooking, Long> {

    List<TripBooking> findByTrip(Trip trip);

    List<TripBooking> findByTripAndStatus(Trip trip, TripBooking.BookingStatus status);

    List<TripBooking> findByTripAndStatusIn(Trip trip, List<TripBooking.BookingStatus> statuses);

    boolean existsByTripAndStatus(Trip trip, TripBooking.BookingStatus status);

    boolean existsByTripAndSenderAndStatusIn(Trip trip, User sender, List<TripBooking.BookingStatus> statuses);

    /** Returns all booking requests submitted by the given user. */
    List<TripBooking> findBySender(User sender);
}
