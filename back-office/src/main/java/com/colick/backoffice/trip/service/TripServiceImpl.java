package com.colick.backoffice.trip.service;

import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.TripBookingConflictException;
import com.colick.backoffice.exception.ResourceNotFoundException;
import com.colick.backoffice.exception.ValidationCodeDeliveryException;
import com.colick.backoffice.location.entity.LocationType;
import com.colick.backoffice.location.repository.LocationRepository;
import com.colick.backoffice.trip.dto.*;
import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.entity.TripBooking;
import com.colick.backoffice.trip.repository.TripBookingRepository;
import com.colick.backoffice.trip.repository.TripRepository;
import com.colick.backoffice.user.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Implementation of {@link TripService}.
 */
@Service
@Transactional
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final TripBookingRepository bookingRepository;
    private final EmailService emailService;
    private final LocationRepository locationRepository;
    private final BookingValidationService bookingValidationService;

    public TripServiceImpl(TripRepository tripRepository,
                           TripBookingRepository bookingRepository,
                           EmailService emailService,
                           LocationRepository locationRepository,
                           BookingValidationService bookingValidationService) {
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
        this.locationRepository = locationRepository;
        this.bookingValidationService = bookingValidationService;
    }

    @Override
    public TripResponse createTrip(CreateTripRequest request, User traveler) {
        Trip trip = Trip.builder()
                .traveler(traveler)
                .departureAddress(request.getDepartureAddress())
                .destination(request.getDestination())
                .departureTime(request.getDepartureTime())
                .arrivalTime(request.getArrivalTime())
                .maxWeight(request.getMaxWeight())
                .pricePerKilo(request.getPricePerKilo())
                .instantAcceptance(request.isInstantAcceptance())
                .build();
        return TripResponse.from(tripRepository.save(trip));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getAllTrips() {
        return tripRepository.findByStatus(Trip.TripStatus.ACTIVE).stream()
                .map(TripResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripById(Long id) {
        return TripResponse.from(findTripOrThrow(id));
    }

    @Override
    public TripResponse updateTrip(Long id, UpdateTripRequest request, User requester) {
        Trip trip = findTripOrThrow(id);
        assertTripOwner(trip, requester);

        if (request.getDepartureAddress() != null) trip.setDepartureAddress(request.getDepartureAddress());
        if (request.getDestination() != null) trip.setDestination(request.getDestination());
        if (request.getDepartureTime() != null) trip.setDepartureTime(request.getDepartureTime());
        if (request.getArrivalTime() != null) trip.setArrivalTime(request.getArrivalTime());
        if (request.getMaxWeight() != null) trip.setMaxWeight(request.getMaxWeight());
        if (request.getPricePerKilo() != null) trip.setPricePerKilo(request.getPricePerKilo());
        if (request.getInstantAcceptance() != null) trip.setInstantAcceptance(request.getInstantAcceptance());

        return TripResponse.from(tripRepository.save(trip));
    }

    @Override
    public void deleteTrip(Long id, User requester) {
        Trip trip = findTripOrThrow(id);
        assertTripOwner(trip, requester);
        trip.setStatus(Trip.TripStatus.CANCELLED);
        tripRepository.save(trip);

        // Notify all senders with PENDING or ACCEPTED bookings
        List<TripBooking.BookingStatus> activeStatuses = List.of(
                TripBooking.BookingStatus.PENDING,
                TripBooking.BookingStatus.ACCEPTED);
        List<TripBooking> activeBookings = bookingRepository.findByTripAndStatusIn(trip, activeStatuses);
        activeBookings.forEach(bookingValidationService::invalidateValidationCode);
        bookingRepository.saveAll(activeBookings);
        activeBookings.forEach(b -> emailService.sendTripCancelledEmail(
                b.getSender().getEmail(),
                b.getSender().getFirstName(),
                trip.getDepartureAddress(),
                trip.getDestination()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripBookingResponse> getBookings(Long tripId, User requester) {
        Trip trip = findTripOrThrow(tripId);
        assertTripOwner(trip, requester);
        return bookingRepository.findByTrip(trip).stream()
                .filter(booking -> booking.getStatus() != TripBooking.BookingStatus.REMOVED)
                .map(TripBookingResponse::from)
                .toList();
    }

    @Override
    public TripBookingResponse createBooking(Long tripId, CreateBookingRequest request, User sender) {
        Trip trip = findTripOrThrow(tripId);

        if (trip.getTraveler().getId().equals(sender.getId())) {
            throw new IllegalArgumentException("You cannot create a booking request for your own trip");
        }

        List<TripBooking.BookingStatus> activeStatuses = List.of(
                TripBooking.BookingStatus.PENDING,
                TripBooking.BookingStatus.ACCEPTED);
        if (bookingRepository.existsByTripAndSenderAndStatusIn(trip, sender, activeStatuses)) {
            throw new TripBookingConflictException("Vous avez deja une demande en cours pour ce trajet");
        }

        // Validate that the requested weight does not exceed the available weight
        BigDecimal availableWeight = computeAvailableWeight(trip);
        if (request.getWeight() != null && request.getWeight().compareTo(availableWeight) > 0) {
            throw new IllegalArgumentException("Requested weight exceeds available weight");
        }

        TripBooking.BookingStatus initialStatus = trip.isInstantAcceptance()
                ? TripBooking.BookingStatus.ACCEPTED
                : TripBooking.BookingStatus.PENDING;

        TripBooking booking = TripBooking.builder()
                .trip(trip)
                .sender(sender)
                .title(request.getTitle())
                .weight(request.getWeight())
                .description(request.getDescription())
                .packagePhotoUrl(request.getPackagePhotoUrl())
                .recipientContact(bookingValidationService.normalizeRecipientContact(request.getRecipientContact()))
                .status(initialStatus)
                .build();

        TripBooking saved = bookingRepository.save(booking);

        if (initialStatus == TripBooking.BookingStatus.ACCEPTED) {
            saved = deliverValidationCodeWithoutBlockingAcceptance(saved);
        }

        emailService.sendTripBookingCreatedEmail(
            trip.getTraveler().getEmail(),
            trip.getTraveler().getFirstName(),
            sender.getFirstName(),
            trip.getDepartureAddress(),
            trip.getDestination()
        );

        return TripBookingResponse.from(saved);
    }

    @Override
    public TripBookingResponse acceptBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);

        if (booking.getStatus() == TripBooking.BookingStatus.ACCEPTED) {
            return TripBookingResponse.from(booking);
        }
        if (booking.getStatus() != TripBooking.BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be accepted");
        }

        booking.setStatus(TripBooking.BookingStatus.ACCEPTED);
        TripBooking saved = bookingRepository.save(booking);
        saved = deliverValidationCodeWithoutBlockingAcceptance(saved);

        emailService.sendTripBookingAcceptedEmail(
            booking.getSender().getEmail(),
            booking.getSender().getFirstName(),
            booking.getTrip().getDepartureAddress(),
            booking.getTrip().getDestination()
        );

        return TripBookingResponse.from(saved);
    }

    @Override
    public TripBookingResponse rejectBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);

        if (booking.getStatus() == TripBooking.BookingStatus.REJECTED) {
            return TripBookingResponse.from(booking);
        }
        if (booking.getStatus() != TripBooking.BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected");
        }

        booking.setStatus(TripBooking.BookingStatus.REJECTED);
        bookingValidationService.invalidateValidationCode(booking);
        TripBooking saved = bookingRepository.save(booking);

        emailService.sendTripBookingRejectedEmail(
            booking.getSender().getEmail(),
            booking.getSender().getFirstName(),
            booking.getTrip().getDepartureAddress(),
            booking.getTrip().getDestination()
        );

        return TripBookingResponse.from(saved);
    }

    @Override
    public void removeBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);

        if (booking.getStatus() == TripBooking.BookingStatus.REMOVED) {
            return;
        }
        if (booking.getStatus() != TripBooking.BookingStatus.ACCEPTED) {
            throw new IllegalStateException("Only ACCEPTED bookings can be removed");
        }

        booking.setStatus(TripBooking.BookingStatus.REMOVED);
        bookingValidationService.invalidateValidationCode(booking);
        bookingRepository.save(booking);

        emailService.sendTripBookingRemovedEmail(
            booking.getSender().getEmail(),
            booking.getSender().getFirstName(),
            booking.getTrip().getDepartureAddress(),
            booking.getTrip().getDestination()
        );
    }

    @Override
    public TripBookingResponse cancelBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);

        if (!booking.getSender().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You are not the sender of this booking");
        }

        if (booking.getStatus() != TripBooking.BookingStatus.PENDING
                && booking.getStatus() != TripBooking.BookingStatus.ACCEPTED) {
            throw new IllegalStateException("Only PENDING or ACCEPTED bookings can be cancelled");
        }

        booking.setStatus(TripBooking.BookingStatus.CANCELLED);
        bookingValidationService.invalidateValidationCode(booking);
        TripBooking saved = bookingRepository.save(booking);

        emailService.sendBookingCancelledBySenderEmail(
                booking.getTrip().getTraveler().getEmail(),
                booking.getTrip().getTraveler().getFirstName(),
                requester.getFirstName(),
                booking.getTrip().getDepartureAddress(),
                booking.getTrip().getDestination());

        return TripBookingResponse.from(saved);
    }

    private Trip findTripOrThrow(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip not found with id: " + id));
    }

    private TripBooking findBookingOrThrow(Long tripId, Long bookingId) {
        findTripOrThrow(tripId); // ensure trip exists
        return bookingRepository.findById(bookingId)
                .filter(b -> b.getTrip().getId().equals(tripId))
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
    }

    private void assertTripOwner(Trip trip, User requester) {
        if (!trip.getTraveler().getId().equals(requester.getId())
                && requester.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException("You are not the owner of this trip");
        }
    }

    private TripBooking deliverValidationCodeWithoutBlockingAcceptance(TripBooking booking) {
        try {
            bookingValidationService.sendValidationCode(booking);
        } catch (ValidationCodeDeliveryException ex) {
            bookingValidationService.markValidationCodeDeliveryFailed(
                    booking,
                    ex.getRecipientContact(),
                    ex.getDeliveryChannel()
            );
        }
        return bookingRepository.save(booking);
    }

    // ---- Trip search -------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> searchTrips(String departure, String destination) {
        List<Trip> activeTrips = tripRepository.findByStatus(Trip.TripStatus.ACTIVE);

        Set<String> departureTerms = expandSearchTerm(departure);
        Set<String> destinationTerms = expandSearchTerm(destination);

        return activeTrips.stream()
                .filter(t -> departureTerms == null || matchesAnyTerm(t.getDepartureAddress(), departureTerms))
                .filter(t -> destinationTerms == null || matchesAnyTerm(t.getDestination(), destinationTerms))
                .map(t -> TripResponse.from(t, computeAvailableWeight(t)))
                .toList();
    }

    /**
     * Expands a search term into a set of lower-case strings to match against.
     * If the term corresponds to a country name, all city names in that country are included.
     *
     * @return {@code null} when no filter should be applied (term is blank),
     *         otherwise a non-empty set of lower-case match terms
     */
    private Set<String> expandSearchTerm(String term) {
        if (term == null || term.isBlank()) {
            return null;
        }
        Set<String> terms = new LinkedHashSet<>();
        terms.add(term.toLowerCase());

        // Country-expansion: if the term matches a country, include its cities
        List<String> cityNames = locationRepository.findNamesByTypeAndCountryContaining(
                LocationType.CITY, term);
        cityNames.forEach(city -> terms.add(city.toLowerCase()));

        return terms;
    }

    /**
     * Returns {@code true} when the given value partially matches at least one of the terms
     * (case-insensitive, bi-directional contains).
     */
    private boolean matchesAnyTerm(String value, Set<String> terms) {
        if (value == null) {
            return false;
        }
        String lowerValue = value.toLowerCase();
        return terms.stream()
                .anyMatch(term -> lowerValue.contains(term) || term.contains(lowerValue));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getMyTrips(User user) {
        return tripRepository.findByTraveler(user).stream()
                .map(TripResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripBookingResponse> getMyBookings(User user) {
        return bookingRepository.findBySender(user).stream()
                .map(TripBookingResponse::from)
                .toList();
    }

    /**
     * Computes the available weight for a trip:
     * {@code maxWeight − sum(weight of ACCEPTED bookings)}.
     */
    private BigDecimal computeAvailableWeight(Trip trip) {
        List<TripBooking> accepted = bookingRepository.findByTripAndStatus(
                trip, TripBooking.BookingStatus.ACCEPTED);
        BigDecimal totalBooked = accepted.stream()
                .map(TripBooking::getWeight)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return trip.getMaxWeight().subtract(totalBooked);
    }
}
