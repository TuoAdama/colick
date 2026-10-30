package com.coliclic.backoffice.trip.repository;

import com.coliclic.backoffice.trip.entity.Trip;
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
 * JPA repository for {@link Trip} entities.
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    @Query("select item from Trip item where item.traveler.id = :userId "
            + "order by case when item.createdAt is null then 1 else 0 end, item.createdAt desc, item.id desc")
    Page<Trip> findAdminHistory(
            @Param("userId") Long userId,
            Pageable pageable);

    long countByTraveler(User traveler);

    List<Trip> findByStatus(Trip.TripStatus status);

    /** Returns all trips published by the given traveler, regardless of status. */
    List<Trip> findByTraveler(User traveler);

    Optional<Trip> findByReferenceIgnoreCase(String reference);

    Optional<Trip> findByReferenceIgnoreCaseAndStatus(String reference, Trip.TripStatus status);

    long countByTravelerAndStatus(User traveler, Trip.TripStatus status);

    boolean existsByTravelerAndStatusIn(User traveler, List<Trip.TripStatus> statuses);

    Optional<Trip> findFirstByTravelerAndCreatedAtIsNotNullOrderByCreatedAtAsc(User traveler);

    @Query("select t from Trip t where t.reference is null or trim(t.reference) = ''")
    List<Trip> findTripsMissingReference();
}
