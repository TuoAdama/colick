package com.coliclic.backoffice.location.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Reference entity representing a geographic location (country or city)
 * used for auto-complete and trip-search country-expansion.
 */
@Entity
@Table(name = "locations", uniqueConstraints = @UniqueConstraint(columnNames = {"name", "country"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Display name of the location (e.g. "Paris", "France"). */
    @Column(nullable = false)
    private String name;

    /**
     * Country this location belongs to.
     * For COUNTRY entries the value equals {@link #name}.
     * For CITY entries the value is the parent country name.
     */
    @Column(nullable = false)
    private String country;

    /** ISO 3166-1 alpha-2 country code. */
    @Column(nullable = false, length = 2)
    private String isoCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LocationType type;
}
