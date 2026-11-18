package com.coliclic.backoffice.trip.repository;

import com.coliclic.backoffice.admin.dto.AdminActivityCount;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link Trip} entities.
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    /** Shared serialization point for every trip/booking mutation. */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select trip from Trip trip where trip.id = :id")
    Optional<Trip> findByIdForUpdate(@Param("id") Long id);

    @Query("select item from Trip item where item.traveler.id = :userId "
            + "order by case when item.createdAt is null then 1 else 0 end, item.createdAt desc, item.id desc")
    Page<Trip> findAdminHistory(
            @Param("userId") Long userId,
            Pageable pageable);

    // PostgreSQL needs an explicit type for the JDBC parameter used in the null check.
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "traveler")
    @Query("""
            select trip from Trip trip join trip.traveler traveler
            where (cast(:createdFrom as LocalDateTime) is null or trip.createdAt >= :createdFrom)
              and (:q = '' or locate(:q, lower(trip.reference)) > 0
                or locate(:q, lower(concat(traveler.firstName, ' ', traveler.lastName))) > 0)
            order by case when trip.createdAt is null then 1 else 0 end
            """)
    Page<Trip> findAllForAdmin(@Param("createdFrom") LocalDateTime createdFrom, @Param("q") String query,
                              Pageable pageable);

    long countByTraveler(User traveler);

    @Query("select trip.traveler.id as userId, count(trip) as activityCount from Trip trip "
            + "where trip.traveler.id in :userIds group by trip.traveler.id")
    List<AdminActivityCount> countAdminTripsByUserIds(@Param("userIds") Collection<Long> userIds);

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
