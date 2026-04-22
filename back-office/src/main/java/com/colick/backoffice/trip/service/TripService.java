package com.colick.backoffice.trip.service;

import com.colick.backoffice.trip.dto.*;
import com.colick.backoffice.user.entity.User;

import java.util.List;

/**
 * Service interface for trip and booking management operations.
 */
public interface TripService {

    /** Publishes a new trip for the given traveler. */
    TripResponse createTrip(CreateTripRequest request, User traveler);

    /** Returns all active trips. */
    List<TripResponse> getAllTrips();

    /** Returns a single trip by ID. */
    TripResponse getTripById(Long id);

    /** Updates an existing trip. */
    TripResponse updateTrip(Long id, UpdateTripRequest request, User requester);

    /** Cancels (soft-deletes) a trip. */
    void deleteTrip(Long id, User requester);

    /** Returns all booking requests for a trip. */
    List<TripBookingResponse> getBookings(Long tripId);

    /** Submits a booking request on a trip. */
    TripBookingResponse createBooking(Long tripId, CreateBookingRequest request, User sender);

    /** Accepts a booking request (sends email notification). */
    TripBookingResponse acceptBooking(Long tripId, Long bookingId, User requester);

    /** Rejects a booking request (sends email notification). */
    TripBookingResponse rejectBooking(Long tripId, Long bookingId, User requester);

    /** Removes a booking request from the list (sends email notification). */
    void removeBooking(Long tripId, Long bookingId, User requester);

    /**
     * Searches active trips by departure and/or destination.
     * <p>If a search term matches a country name, all cities in that country are included
     * in the matching set (country-expansion).</p>
     *
     * @param departure   departure filter (optional)
     * @param destination destination filter (optional)
     * @return matching trips with their available weight computed
     */
    List<TripResponse> searchTrips(String departure, String destination);

    /** Returns all trips published by the given user (all statuses). */
    List<TripResponse> getMyTrips(User user);

    /** Returns all booking requests sent by the given user. */
    List<TripBookingResponse> getMyBookings(User user);
}
