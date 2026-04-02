package com.colick.backoffice.trip.controller;

import com.colick.backoffice.trip.dto.*;
import com.colick.backoffice.trip.service.TripService;
import com.colick.backoffice.user.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * REST controller for trip and booking management endpoints.
 */
@RestController
@RequestMapping("/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    /** Publish a new trip. Requires authentication. */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripResponse> createTrip(
            @Valid @RequestBody CreateTripRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tripService.createTrip(request, currentUser));
    }

    /**
     * Public search endpoint.
     * At least one of {@code departure} or {@code destination} must be provided.
     */
    @GetMapping("/search")
    public ResponseEntity<List<TripResponse>> searchTrips(
            @RequestParam(required = false) String departure,
            @RequestParam(required = false) String destination) {

        if ((departure == null || departure.isBlank())
                && (destination == null || destination.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "At least one of 'departure' or 'destination' is required");
        }
        return ResponseEntity.ok(tripService.searchTrips(departure, destination));
    }

    /** List all active trips (public). */
    @GetMapping
    public ResponseEntity<List<TripResponse>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    /** Get a trip by ID (public). */
    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    /** Update a trip. Only the traveler or an admin can do this. */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripResponse> updateTrip(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTripRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.updateTrip(id, request, currentUser));
    }

    /** Cancel a trip. Only the traveler or an admin can do this. */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteTrip(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        tripService.deleteTrip(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    /** List all booking requests for a trip. */
    @GetMapping("/{id}/bookings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TripBookingResponse>> getBookings(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getBookings(id));
    }

    /** Submit a booking request on a trip. */
    @PostMapping("/{id}/bookings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripBookingResponse> createBooking(
            @PathVariable Long id,
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tripService.createBooking(id, request, currentUser));
    }

    /** Accept a booking request. Only the trip owner can do this. */
    @PutMapping("/{id}/bookings/{bookingId}/accept")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripBookingResponse> acceptBooking(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.acceptBooking(id, bookingId, currentUser));
    }

    /** Reject a booking request. Only the trip owner can do this. */
    @PutMapping("/{id}/bookings/{bookingId}/reject")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripBookingResponse> rejectBooking(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.rejectBooking(id, bookingId, currentUser));
    }

    /** Remove a user from the booking list. Only the trip owner can do this. */
    @DeleteMapping("/{id}/bookings/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeBooking(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User currentUser) {
        tripService.removeBooking(id, bookingId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
