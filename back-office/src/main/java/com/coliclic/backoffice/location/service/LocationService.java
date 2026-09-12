package com.coliclic.backoffice.location.service;

import com.coliclic.backoffice.location.dto.LocationResponse;

import java.util.List;

/**
 * Service interface for location auto-complete operations.
 */
public interface LocationService {

    /**
     * Searches locations whose name starts with the given query
     * (case-insensitive, limited to 10 results).
     *
     * @param query the name prefix to search for
     * @return matching locations ordered alphabetically
     */
    List<LocationResponse> search(String query);
}
