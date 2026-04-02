package com.colick.backoffice.location.controller;

import com.colick.backoffice.location.dto.LocationResponse;
import com.colick.backoffice.location.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public REST controller for location auto-complete.
 * No authentication required.
 */
@RestController
@RequestMapping("/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    /**
     * Auto-complete endpoint.
     * Returns up to 10 locations whose name starts with the given query.
     *
     * @param q the search prefix (required)
     * @return matching locations ordered alphabetically
     */
    @GetMapping("/search")
    public ResponseEntity<List<LocationResponse>> search(@RequestParam String q) {
        return ResponseEntity.ok(locationService.search(q));
    }
}
