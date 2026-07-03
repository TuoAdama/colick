package com.colick.backoffice.trip.repository;

import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link Trip} entities.
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByStatus(Trip.TripStatus status);

    /** Returns all trips published by the given traveler, regardless of status. */
    List<Trip> findByTraveler(User traveler);

    Optional<Trip> findByReferenceIgnoreCase(String reference);

    Optional<Trip> findByReferenceIgnoreCaseAndStatus(String reference, Trip.TripStatus status);

    long countByTravelerAndStatus(User traveler, Trip.TripStatus status);

    @Query("select t from Trip t where t.reference is null or trim(t.reference) = ''")
    List<Trip> findTripsMissingReference();
}
