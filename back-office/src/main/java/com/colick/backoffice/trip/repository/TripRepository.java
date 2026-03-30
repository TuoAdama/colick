package com.colick.backoffice.trip.repository;

import com.colick.backoffice.trip.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * JPA repository for {@link Trip} entities.
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    List<Trip> findByStatus(Trip.TripStatus status);
}
