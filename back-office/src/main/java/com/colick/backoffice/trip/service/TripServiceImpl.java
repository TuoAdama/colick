package com.colick.backoffice.trip.service;

import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.ResourceNotFoundException;
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

    public TripServiceImpl(TripRepository tripRepository,
                           TripBookingRepository bookingRepository,
                           EmailService emailService,
                           LocationRepository locationRepository) {
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
        this.locationRepository = locationRepository;
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
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripBookingResponse> getBookings(Long tripId) {
        Trip trip = findTripOrThrow(tripId);
        return bookingRepository.findByTrip(trip).stream()
                .map(TripBookingResponse::from)
                .toList();
    }

    @Override
    public TripBookingResponse createBooking(Long tripId, CreateBookingRequest request, User sender) {
        Trip trip = findTripOrThrow(tripId);

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
                .recipientContact(request.getRecipientContact())
                .status(initialStatus)
                .build();

        TripBooking saved = bookingRepository.save(booking);

        // Notify the traveler about the new booking request
        emailService.sendEmail(
                trip.getTraveler().getEmail(),
                "Nouvelle demande de transport — Colick",
                String.format(
                        "Bonjour %s,%n%nUne nouvelle demande a été soumise pour votre trajet %s → %s.%n%nConnectez-vous à Colick pour la traiter.%n%nCordialement,%nL'équipe Colick",
                        trip.getTraveler().getFirstName(),
                        trip.getDepartureAddress(),
                        trip.getDestination()
                )
        );

        return TripBookingResponse.from(saved);
    }

    @Override
    public TripBookingResponse acceptBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);

        booking.setStatus(TripBooking.BookingStatus.ACCEPTED);
        TripBooking saved = bookingRepository.save(booking);

        emailService.sendEmail(
                booking.getSender().getEmail(),
                "Votre demande a été acceptée — Colick",
                String.format(
                        "Bonjour %s,%n%nVotre demande pour le trajet %s → %s a été acceptée.%n%nCordialement,%nL'équipe Colick",
                        booking.getSender().getFirstName(),
                        booking.getTrip().getDepartureAddress(),
                        booking.getTrip().getDestination()
                )
        );

        return TripBookingResponse.from(saved);
    }

    @Override
    public TripBookingResponse rejectBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);

        booking.setStatus(TripBooking.BookingStatus.REJECTED);
        TripBooking saved = bookingRepository.save(booking);

        emailService.sendEmail(
                booking.getSender().getEmail(),
                "Votre demande a été refusée — Colick",
                String.format(
                        "Bonjour %s,%n%nNous sommes désolés, votre demande pour le trajet %s → %s a été refusée.%n%nCordialement,%nL'équipe Colick",
                        booking.getSender().getFirstName(),
                        booking.getTrip().getDepartureAddress(),
                        booking.getTrip().getDestination()
                )
        );

        return TripBookingResponse.from(saved);
    }

    @Override
    public void removeBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);

        emailService.sendEmail(
                booking.getSender().getEmail(),
                "Vous avez été retiré d'un trajet — Colick",
                String.format(
                        "Bonjour %s,%n%nVous avez été retiré de la liste pour le trajet %s → %s.%n%nCordialement,%nL'équipe Colick",
                        booking.getSender().getFirstName(),
                        booking.getTrip().getDepartureAddress(),
                        booking.getTrip().getDestination()
                )
        );

        bookingRepository.delete(booking);
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
