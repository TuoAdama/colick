package com.colick.backoffice.trip.repository;

import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * JPA repository for {@link Trip} entities.
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByStatus(Trip.TripStatus status);

    /** Returns all trips published by the given traveler, regardless of status. */
    List<Trip> findByTraveler(User traveler);
}
