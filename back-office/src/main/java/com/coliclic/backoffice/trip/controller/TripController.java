package com.coliclic.backoffice.trip.controller;

import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.trip.dto.*;
import com.coliclic.backoffice.trip.service.TripService;
import com.coliclic.backoffice.user.entity.User;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for trip and booking management endpoints.
 */
@RestController
@RequestMapping("/trips")
public class TripController {

    private final TripService tripService;
    private final LocalizedMessages localizedMessages;

    public TripController(TripService tripService, LocalizedMessages localizedMessages) {
        this.tripService = tripService;
        this.localizedMessages = localizedMessages;
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
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {

        if ((departure == null || departure.isBlank())
                && (destination == null || destination.isBlank())) {
            throw new BadRequestException(localizedMessages.get("error.trip.searchCriteriaRequired"));
        }
        return ResponseEntity.ok(tripService.searchTrips(departure, destination, date, sort, minPrice, maxPrice));
    }

    /** List all active trips (public). */
    @GetMapping
    public ResponseEntity<List<TripResponse>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    /** Landing page feed: latest relevant active trips, optionally scoped by country. */
    @GetMapping("/landing-feed")
    public ResponseEntity<List<TripResponse>> getLandingFeed(
            @RequestParam(required = false) String country,
            @RequestParam(defaultValue = "3") int limit) {
        return ResponseEntity.ok(tripService.getLandingFeed(country, limit));
    }

    /** Get a public trip by its business reference. */
    @GetMapping("/reference/{reference}")
    public ResponseEntity<TripResponse> getTripByReference(@PathVariable String reference) {
        return ResponseEntity.ok(tripService.getTripByReference(reference));
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

    /** Marks a trip as completed once the traveler has performed it. */
    @PutMapping("/{id}/complete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripResponse> completeTrip(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.completeTrip(id, currentUser));
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
    public ResponseEntity<List<TripBookingResponse>> getBookings(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.getBookings(id, currentUser));
    }

    /** Returns a single booking request for a trip. */
    @GetMapping("/{id}/bookings/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripBookingResponse> getBookingById(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.getBookingById(id, bookingId, currentUser));
    }

    /** Returns the sender profile data associated with a booking. */
    @GetMapping("/{id}/bookings/{bookingId}/sender-profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripBookingSenderProfileResponse> getBookingSenderProfile(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.getBookingSenderProfile(id, bookingId, currentUser));
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

    /** Confirms that the traveler has delivered the parcel to the recipient. */
    @PutMapping("/{id}/bookings/{bookingId}/deliver")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripBookingResponse> confirmBookingDelivery(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @Valid @RequestBody ConfirmBookingDeliveryRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.confirmBookingDelivery(id, bookingId, request, currentUser));
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

    /** Cancel a booking. Only the sender of the booking can do this. */
    @PutMapping("/{id}/bookings/{bookingId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripBookingResponse> cancelBooking(
            @PathVariable Long id,
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.cancelBooking(id, bookingId, currentUser));
    }

    /** Get trips published by the current user (all statuses). */
    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TripResponse>> getMyTrips(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.getMyTrips(currentUser));
    }

    /** Get booking requests sent by the current user. */
    @GetMapping("/bookings/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SentTripBookingResponse>> getMyBookings(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripService.getMyBookings(currentUser));
    }
}
