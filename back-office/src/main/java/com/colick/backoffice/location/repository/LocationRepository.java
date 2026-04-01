package com.colick.backoffice.location.repository;

import com.colick.backoffice.location.entity.Location;
import com.colick.backoffice.location.entity.LocationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * JPA repository for {@link Location} reference data.
 */
@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    /**
     * Auto-complete: returns at most 10 locations whose name starts with
     * the given prefix (case-insensitive), ordered alphabetically.
     */
    List<Location> findTop10ByNameStartingWithIgnoreCaseOrderByNameAsc(String prefix);

    /**
     * Returns the names of all CITY locations whose country name contains
     * the given string (case-insensitive).
     * Used for country-expansion during trip search.
     */
    @Query("SELECT l.name FROM Location l WHERE l.type = :type "
         + "AND LOWER(l.country) LIKE LOWER(CONCAT('%', :country, '%'))")
    List<String> findNamesByTypeAndCountryContaining(
            @Param("type") LocationType type,
            @Param("country") String country);
}
