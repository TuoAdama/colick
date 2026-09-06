package com.coliclic.backoffice.trip.service;

import com.coliclic.backoffice.trip.dto.*;
import com.coliclic.backoffice.user.entity.User;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    /** Returns a single trip by business reference. */
    TripResponse getTripByReference(String reference);

    /** Updates an existing trip. */
    TripResponse updateTrip(Long id, UpdateTripRequest request, User requester);

    /** Marks a trip as completed once the traveler has finished the route. */
    TripResponse completeTrip(Long id, User requester);

    /** Cancels (soft-deletes) a trip. */
    void deleteTrip(Long id, User requester);

    /** Returns all booking requests for a trip. */
    List<TripBookingResponse> getBookings(Long tripId, User requester);

    /** Returns a single booking for a trip when visible to the requester. */
    TripBookingResponse getBookingById(Long tripId, Long bookingId, User requester);

    /** Returns sender profile data for the selected booking. */
    TripBookingSenderProfileResponse getBookingSenderProfile(Long tripId, Long bookingId, User requester);

    /** Submits a booking request on a trip. */
    TripBookingResponse createBooking(Long tripId, CreateBookingRequest request, User sender);

    /** Accepts a booking request (sends email notification). */
    TripBookingResponse acceptBooking(Long tripId, Long bookingId, User requester);

    /** Confirms parcel handoff by validating the code received by the recipient. */
    TripBookingResponse confirmBookingDelivery(Long tripId, Long bookingId, ConfirmBookingDeliveryRequest request, User requester);

    /** Rejects a booking request (sends email notification). */
    TripBookingResponse rejectBooking(Long tripId, Long bookingId, User requester);

    /** Removes a booking request from the list (sends email notification). */
    void removeBooking(Long tripId, Long bookingId, User requester);

    /**
     * Cancels a booking. Only the sender of the booking can cancel.
     * Booking must be in PENDING or ACCEPTED status.
     */
    TripBookingResponse cancelBooking(Long tripId, Long bookingId, User requester);

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

    /**
     * Searches active trips by route and optional filters.
     *
     * @param departure   departure filter (optional)
     * @param destination destination filter (optional)
     * @param date        minimum departure date, inclusive (optional)
     * @param sort        optional sort key: price_asc, departure_asc, rating_desc
     * @param minPrice    minimum price per kilo, inclusive (optional)
     * @param maxPrice    maximum price per kilo, inclusive (optional)
     * @return matching trips with their available weight computed
     */
    List<TripResponse> searchTrips(String departure,
                                   String destination,
                                   LocalDate date,
                                   String sort,
                                   BigDecimal minPrice,
                                   BigDecimal maxPrice);

    /**
     * Returns a small public feed for the landing page.
     * When a country is provided, matching active trips are preferred before
     * falling back to latest active trips.
     */
    List<TripResponse> getLandingFeed(String country, int limit);

    /** Returns all trips published by the given user (all statuses). */
    List<TripResponse> getMyTrips(User user);

    /** Returns all booking requests sent by the given user. */
    List<SentTripBookingResponse> getMyBookings(User user);
}
