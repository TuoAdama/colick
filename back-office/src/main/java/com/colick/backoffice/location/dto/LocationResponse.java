package com.colick.backoffice.location.dto;

import com.colick.backoffice.location.entity.Location;
import com.colick.backoffice.location.entity.LocationType;
import lombok.Builder;
import lombok.Data;

/**
 * Read-only DTO returned by the location auto-complete endpoint.
 */
@Data
@Builder
public class LocationResponse {

    private Long id;
    private String name;
    private String country;
    private String isoCode;
    private LocationType type;

    /**
     * Maps a {@link Location} entity to a {@link LocationResponse} DTO.
     */
    public static LocationResponse from(Location location) {
        return LocationResponse.builder()
                .id(location.getId())
                .name(location.getName())
                .country(location.getCountry())
                .isoCode(location.getIsoCode())
                .type(location.getType())
                .build();
    }
}
