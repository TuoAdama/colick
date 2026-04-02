package com.colick.backoffice.location.service;

import com.colick.backoffice.location.dto.LocationResponse;
import com.colick.backoffice.location.repository.LocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation of {@link LocationService}.
 */
@Service
@Transactional(readOnly = true)
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;

    public LocationServiceImpl(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Override
    public List<LocationResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return locationRepository
                .findTop10ByNameStartingWithIgnoreCaseOrderByNameAsc(query)
                .stream()
                .map(LocationResponse::from)
                .toList();
    }
}
