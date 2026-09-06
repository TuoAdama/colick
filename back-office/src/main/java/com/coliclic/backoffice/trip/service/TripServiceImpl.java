package com.coliclic.backoffice.trip.service;

import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ConflictException;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.exception.TripBookingConflictException;
import com.coliclic.backoffice.exception.TripUpdateNotAllowedException;
import com.coliclic.backoffice.exception.ValidationCodeDeliveryException;
import com.coliclic.backoffice.file.FileStorageService;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.location.entity.LocationType;
import com.coliclic.backoffice.location.repository.LocationRepository;
import com.coliclic.backoffice.trip.dto.*;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.tripalert.service.TripAlertService;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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
    private final TravelerReviewService travelerReviewService;
    private final LocalizedMessages localizedMessages;
    private final FileStorageService fileStorageService;
    private final TripAlertService tripAlertService;
    private final TripReferenceGenerator tripReferenceGenerator;

    @Value("${app.frontend.base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    public TripServiceImpl(TripRepository tripRepository,
                           TripBookingRepository bookingRepository,
                            EmailService emailService,
                            LocationRepository locationRepository,
                            BookingValidationService bookingValidationService,
                            TravelerReviewService travelerReviewService,
                            LocalizedMessages localizedMessages,
                            FileStorageService fileStorageService,
                            TripAlertService tripAlertService,
                            TripReferenceGenerator tripReferenceGenerator) {
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.emailService = emailService;
        this.locationRepository = locationRepository;
        this.bookingValidationService = bookingValidationService;
        this.travelerReviewService = travelerReviewService;
        this.localizedMessages = localizedMessages;
        this.fileStorageService = fileStorageService;
        this.tripAlertService = tripAlertService;
        this.tripReferenceGenerator = tripReferenceGenerator;
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
                .createdAt(LocalDateTime.now())
                .build();
        trip.setReference(tripReferenceGenerator.generateForNewTrip(trip));
        Trip savedTrip = tripRepository.save(trip);
        tripAlertService.notifyMatchingAlerts(savedTrip);
        return toTripResponse(savedTrip, null, Map.of());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getAllTrips() {
        List<Trip> trips = tripRepository.findByStatus(Trip.TripStatus.ACTIVE);
        return mapTrips(trips, false);
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripById(Long id) {
        return toTripResponse(findTripOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public TripResponse getTripByReference(String reference) {
        Trip trip = tripRepository.findByReferenceIgnoreCaseAndStatus(reference, Trip.TripStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        localizedMessages.get("error.trip.referenceNotFound", reference)));
        return toTripResponse(
                trip,
                computeAvailableWeight(trip),
                travelerReviewService.getTravelerRatingSummaries(Set.of(trip.getTraveler().getId()))
        );
    }

    @Override
    public TripResponse updateTrip(Long id, UpdateTripRequest request, User requester) {
        Trip trip = findTripOrThrow(id);
        assertTripOwner(trip, requester);
        if (trip.getStatus() != Trip.TripStatus.ACTIVE) {
            throw new TripUpdateNotAllowedException(localizedMessages.get("error.trip.onlyActiveUpdatable"));
        }

        if (request.getDepartureAddress() != null) trip.setDepartureAddress(request.getDepartureAddress());
        if (request.getDestination() != null) trip.setDestination(request.getDestination());
        if (request.getDepartureTime() != null) trip.setDepartureTime(request.getDepartureTime());
        if (request.getArrivalTime() != null) trip.setArrivalTime(request.getArrivalTime());
        if (request.getMaxWeight() != null) trip.setMaxWeight(request.getMaxWeight());
        if (request.getPricePerKilo() != null) trip.setPricePerKilo(request.getPricePerKilo());
        if (request.getInstantAcceptance() != null) trip.setInstantAcceptance(request.getInstantAcceptance());

        Trip savedTrip = tripRepository.save(trip);
        notifyAcceptedBookingSendersAboutTripUpdate(savedTrip);
        return toTripResponse(savedTrip);
    }

    @Override
    public TripResponse completeTrip(Long id, User requester) {
        Trip trip = findTripOrThrow(id);
        assertTripOwner(trip, requester);

        if (trip.getStatus() == Trip.TripStatus.COMPLETED) {
            return toTripResponse(trip);
        }
        if (trip.getStatus() != Trip.TripStatus.ACTIVE) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyActiveCompletable"));
        }
        if (bookingRepository.existsByTripAndStatus(trip, TripBooking.BookingStatus.PENDING)) {
            throw new ConflictException(localizedMessages.get("error.trip.pendingBookingsMustBeProcessed"));
        }

        trip.setStatus(Trip.TripStatus.COMPLETED);
        Trip savedTrip = tripRepository.save(trip);
        travelerReviewService.createReviewInvitations(savedTrip);
        return toTripResponse(savedTrip);
    }

    @Override
    public void deleteTrip(Long id, User requester) {
        Trip trip = findTripOrThrow(id);
        assertTripOwner(trip, requester);
        if (trip.getStatus() != Trip.TripStatus.ACTIVE) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyActiveCancelable"));
        }
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
        if (!trip.getTraveler().getId().equals(requester.getId())
                && requester.getRole() != User.Role.ADMIN) {
            throw new ResourceNotFoundException(localizedMessages.get("error.trip.notFound", tripId));
        }
        return toTripBookingResponses(bookingRepository.findByTrip(trip).stream()
                .filter(booking -> booking.getStatus() != TripBooking.BookingStatus.REMOVED)
                .toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TripBookingResponse getBookingById(Long tripId, Long bookingId, User requester) {
        return toTripBookingResponse(findVisibleBookingOrThrow(tripId, bookingId, requester, true));
    }

    @Override
    @Transactional(readOnly = true)
    public TripBookingSenderProfileResponse getBookingSenderProfile(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findVisibleBookingOrThrow(tripId, bookingId, requester);

        User sender = booking.getSender();
        TravelerRatingSummary summary = travelerReviewService.getTravelerRatingSummaries(Set.of(sender.getId()))
                .get(sender.getId());

        return TripBookingSenderProfileResponse.builder()
                .completedTripCount(tripRepository.countByTravelerAndStatus(sender, Trip.TripStatus.COMPLETED))
                .sentPackageCount(bookingRepository.countBySender(sender))
                .averageRating(summary != null ? summary.averageRating() : null)
                .reviewCount(summary != null ? summary.reviewCount() : 0L)
                .reviews(travelerReviewService.getSubmittedReviewsForTraveler(sender.getId()))
                .build();
    }

    @Override
    public TripBookingResponse createBooking(Long tripId, CreateBookingRequest request, User sender) {
        Trip trip = findTripOrThrow(tripId);

        if (trip.getStatus() != Trip.TripStatus.ACTIVE) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyActiveBookingsCreatable"));
        }

        if (trip.getTraveler().getId().equals(sender.getId())) {
            throw new BadRequestException(localizedMessages.get("error.trip.selfBooking"));
        }

        List<TripBooking.BookingStatus> activeStatuses = List.of(
                TripBooking.BookingStatus.PENDING,
                TripBooking.BookingStatus.ACCEPTED);
        if (bookingRepository.existsByTripAndSenderAndStatusIn(trip, sender, activeStatuses)) {
            throw new TripBookingConflictException(localizedMessages.get("error.trip.bookingAlreadyExists"));
        }

        // Validate that the requested weight does not exceed the available weight
        BigDecimal availableWeight = computeAvailableWeight(trip);
        if (request.getWeight() != null && request.getWeight().compareTo(availableWeight) > 0) {
            throw new BadRequestException(localizedMessages.get("error.trip.requestedWeightExceedsAvailable"));
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
            trip.getDestination(),
            reservationUrl(trip.getId(), saved.getId())
        );

        return toTripBookingResponse(saved);
    }

    private String reservationUrl(Long tripId, Long bookingId) {
        String baseUrl = frontendBaseUrl == null ? "http://localhost:4200" : frontendBaseUrl;
        return baseUrl.replaceAll("/+$", "") + "/trips/" + tripId + "/reservations/" + bookingId;
    }

    @Override
    public TripBookingResponse acceptBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);
        if (booking.getTrip().getStatus() != Trip.TripStatus.ACTIVE) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyActiveBookingsAcceptable"));
        }

        if (booking.getStatus() == TripBooking.BookingStatus.ACCEPTED) {
            return toTripBookingResponse(booking);
        }
        if (booking.getStatus() != TripBooking.BookingStatus.PENDING) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyPendingBookingsAcceptable"));
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

        return toTripBookingResponse(saved);
    }

    @Override
    public TripBookingResponse confirmBookingDelivery(Long tripId,
                                                      Long bookingId,
                                                      ConfirmBookingDeliveryRequest request,
                                                      User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);

        if (booking.getStatus() == TripBooking.BookingStatus.DELIVERED) {
            return toTripBookingResponse(booking);
        }
        if (booking.getTrip().getStatus() != Trip.TripStatus.COMPLETED) {
            throw new ConflictException(localizedMessages.get("error.trip.completedRequiredForDelivery"));
        }
        if (booking.getStatus() != TripBooking.BookingStatus.ACCEPTED) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyAcceptedBookingsDeliverable"));
        }
        if (!booking.hasActiveValidationCode()) {
            throw new ConflictException(localizedMessages.get("error.trip.noActiveValidationCode"));
        }
        if (!booking.getValidationCode().equals(request.getValidationCode().trim())) {
            throw new BadRequestException(localizedMessages.get("error.trip.invalidValidationCode"));
        }

        booking.setStatus(TripBooking.BookingStatus.DELIVERED);
        booking.setDeliveredAt(LocalDateTime.now());
        bookingValidationService.invalidateValidationCode(booking);
        return toTripBookingResponse(bookingRepository.save(booking));
    }

    @Override
    public TripBookingResponse rejectBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);
        if (booking.getTrip().getStatus() != Trip.TripStatus.ACTIVE) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyActiveBookingsRejectable"));
        }

        if (booking.getStatus() == TripBooking.BookingStatus.REJECTED) {
            return toTripBookingResponse(booking);
        }
        if (booking.getStatus() != TripBooking.BookingStatus.PENDING) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyPendingBookingsRejectable"));
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

        return toTripBookingResponse(saved);
    }

    @Override
    public void removeBooking(Long tripId, Long bookingId, User requester) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);
        assertTripOwner(booking.getTrip(), requester);

        if (booking.getStatus() == TripBooking.BookingStatus.REMOVED) {
            return;
        }
        if (booking.getStatus() != TripBooking.BookingStatus.ACCEPTED) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyAcceptedBookingsRemovable"));
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
            throw new AccessDeniedException(localizedMessages.get("error.trip.notBookingSender"));
        }

        if (booking.getStatus() != TripBooking.BookingStatus.PENDING
                && booking.getStatus() != TripBooking.BookingStatus.ACCEPTED) {
            throw new ConflictException(localizedMessages.get("error.trip.onlyPendingOrAcceptedBookingsCancelable"));
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

        return toTripBookingResponse(saved);
    }

    private Trip findTripOrThrow(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(localizedMessages.get("error.trip.notFound", id)));
    }

    private TripBooking findBookingOrThrow(Long tripId, Long bookingId) {
        findTripOrThrow(tripId); // ensure trip exists
        return bookingRepository.findById(bookingId)
                .filter(b -> b.getTrip().getId().equals(tripId))
                .orElseThrow(() -> new ResourceNotFoundException(localizedMessages.get("error.booking.notFound", bookingId)));
    }

    private TripBooking findVisibleBookingOrThrow(Long tripId, Long bookingId, User requester) {
        return findVisibleBookingOrThrow(tripId, bookingId, requester, false);
    }

    private TripBooking findVisibleBookingOrThrow(Long tripId, Long bookingId, User requester, boolean allowSender) {
        TripBooking booking = findBookingOrThrow(tripId, bookingId);

        if (booking.getStatus() == TripBooking.BookingStatus.REMOVED) {
            throw new ResourceNotFoundException(localizedMessages.get("error.booking.notFound", bookingId));
        }

        if (!booking.getTrip().getTraveler().getId().equals(requester.getId())
                && !(allowSender && booking.getSender().getId().equals(requester.getId()))
                && requester.getRole() != User.Role.ADMIN) {
            throw new ResourceNotFoundException(localizedMessages.get("error.booking.notFound", bookingId));
        }

        return booking;
    }

    private void assertTripOwner(Trip trip, User requester) {
        if (!trip.getTraveler().getId().equals(requester.getId())
                && requester.getRole() != User.Role.ADMIN) {
            throw new AccessDeniedException(localizedMessages.get("error.trip.notOwner"));
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

    private void notifyAcceptedBookingSendersAboutTripUpdate(Trip trip) {
        bookingRepository.findByTripAndStatus(trip, TripBooking.BookingStatus.ACCEPTED)
                .forEach(booking -> emailService.sendTripUpdatedEmail(
                        booking.getSender().getEmail(),
                        booking.getSender().getFirstName(),
                        trip.getDepartureAddress(),
                        trip.getDestination()
                ));
    }

    // ---- Trip search -------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> searchTrips(String departure, String destination) {
        return searchTrips(departure, destination, null, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> searchTrips(String departure,
                                          String destination,
                                          LocalDate date,
                                          String sort,
                                          BigDecimal minPrice,
                                          BigDecimal maxPrice) {
        List<Trip> activeTrips = tripRepository.findByStatus(Trip.TripStatus.ACTIVE);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime dateReferenceTime = date != null ? date.atStartOfDay() : now;
        LocalDateTime searchReferenceTime = dateReferenceTime.isAfter(now) ? dateReferenceTime : now;

        Set<String> departureTerms = expandSearchTerm(departure);
        Set<String> destinationTerms = expandSearchTerm(destination);

        List<Trip> matchingTrips = activeTrips.stream()
                .filter(trip -> departsAtOrAfter(trip, searchReferenceTime))
                .filter(t -> departureTerms == null || matchesAnyTerm(t.getDepartureAddress(), departureTerms))
                .filter(t -> destinationTerms == null || matchesAnyTerm(t.getDestination(), destinationTerms))
                .filter(t -> minPrice == null || t.getPricePerKilo().compareTo(minPrice) >= 0)
                .filter(t -> maxPrice == null || t.getPricePerKilo().compareTo(maxPrice) <= 0)
                .toList();

        List<TripResponse> responses = mapTrips(matchingTrips, true);
        return sortSearchResults(responses, sort);
    }

    private List<TripResponse> sortSearchResults(List<TripResponse> trips, String sort) {
        Comparator<TripResponse> comparator = switch (sort == null ? "" : sort) {
            case "price_asc" -> Comparator.comparing(TripResponse::getPricePerKilo);
            case "departure_asc" -> Comparator.comparing(TripResponse::getDepartureTime);
            case "rating_desc" -> Comparator
                    .comparing(TripResponse::getTravelerRatingAverage, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(TripResponse::getTravelerRatingCount, Comparator.nullsLast(Comparator.reverseOrder()));
            default -> null;
        };

        if (comparator == null) {
            return trips;
        }
        return trips.stream().sorted(comparator).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripResponse> getLandingFeed(String country, int limit) {
        int boundedLimit = Math.max(1, Math.min(limit, 12));
        LocalDateTime referenceTime = LocalDateTime.now();
        List<Trip> activeUpcomingTrips = tripRepository.findByStatus(Trip.TripStatus.ACTIVE).stream()
                .filter(trip -> departsAtOrAfter(trip, referenceTime))
                .toList();

        Set<String> countryTerms = expandSearchTerm(country);
        List<Trip> localTrips = countryTerms == null
                ? List.of()
                : activeUpcomingTrips.stream()
                        .filter(trip -> matchesAnyTerm(trip.getDepartureAddress(), countryTerms)
                                || matchesAnyTerm(trip.getDestination(), countryTerms))
                        .sorted(this::compareLatestPublishedTrips)
                        .limit(boundedLimit)
                        .toList();

        if (!localTrips.isEmpty()) {
            return mapTrips(localTrips, true);
        }

        return mapTrips(activeUpcomingTrips.stream()
                .sorted(this::compareLatestPublishedTrips)
                .limit(boundedLimit)
                .toList(), true);
    }

    private int compareLatestPublishedTrips(Trip first, Trip second) {
        LocalDateTime firstCreatedAt = first.getCreatedAt() != null ? first.getCreatedAt() : first.getDepartureTime();
        LocalDateTime secondCreatedAt = second.getCreatedAt() != null ? second.getCreatedAt() : second.getDepartureTime();
        return Comparator.nullsLast(LocalDateTime::compareTo)
                .reversed()
                .compare(firstCreatedAt, secondCreatedAt);
    }

    private boolean departsAtOrAfter(Trip trip, LocalDateTime referenceTime) {
        LocalDateTime departureTime = trip.getDepartureTime();
        return departureTime != null && !departureTime.isBefore(referenceTime);
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
        return mapTrips(tripRepository.findByTraveler(user), false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SentTripBookingResponse> getMyBookings(User user) {
        List<TripBooking> bookings = bookingRepository.findBySender(user);
        Map<Long, TravelerRatingSummary> senderRatingSummaries = travelerReviewService.getTravelerRatingSummaries(
                bookings.stream()
                        .map(booking -> booking.getSender().getId())
                        .collect(Collectors.toSet())
        );

        return bookings.stream()
                .map(booking -> {
                    TravelerRatingSummary summary = senderRatingSummaries.get(booking.getSender().getId());
                    return SentTripBookingResponse.from(
                            booking,
                            summary != null ? summary.averageRating() : null,
                            summary != null ? summary.reviewCount() : 0L
                    );
                })
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

    private List<TripResponse> mapTrips(List<Trip> trips, boolean includeAvailableWeight) {
        Map<Long, TravelerRatingSummary> travelerRatingSummaries = travelerReviewService.getTravelerRatingSummaries(
                trips.stream()
                        .map(trip -> trip.getTraveler().getId())
                        .collect(Collectors.toSet())
        );

        return trips.stream()
                .map(trip -> toTripResponse(
                        trip,
                        includeAvailableWeight ? computeAvailableWeight(trip) : null,
                        travelerRatingSummaries
                ))
                .toList();
    }

    private TripResponse toTripResponse(Trip trip) {
        return toTripResponse(trip, null, travelerReviewService.getTravelerRatingSummaries(Set.of(trip.getTraveler().getId())));
    }

    private TripResponse toTripResponse(Trip trip,
                                        BigDecimal availableWeight,
                                        Map<Long, TravelerRatingSummary> travelerRatingSummaries) {
        TravelerRatingSummary summary = travelerRatingSummaries.get(trip.getTraveler().getId());
        TripResponse response = TripResponse.from(
                trip,
                availableWeight,
                summary != null ? summary.averageRating() : null,
                summary != null ? summary.reviewCount() : 0L
        );
        response.setTravelerPhotoUrl(fileStorageService.sanitizePublicUrl(response.getTravelerPhotoUrl()));
        return response;
    }

    private List<TripBookingResponse> toTripBookingResponses(List<TripBooking> bookings) {
        Map<Long, TravelerRatingSummary> senderRatingSummaries = travelerReviewService.getTravelerRatingSummaries(
                bookings.stream()
                        .map(booking -> booking.getSender().getId())
                        .collect(Collectors.toSet())
        );

        return bookings.stream()
                .map(booking -> toTripBookingResponse(booking, senderRatingSummaries))
                .toList();
    }

    private TripBookingResponse toTripBookingResponse(TripBooking booking) {
        return toTripBookingResponse(
                booking,
                travelerReviewService.getTravelerRatingSummaries(Set.of(booking.getSender().getId()))
        );
    }

    private TripBookingResponse toTripBookingResponse(TripBooking booking,
                                                      Map<Long, TravelerRatingSummary> senderRatingSummaries) {
        TravelerRatingSummary summary = senderRatingSummaries.get(booking.getSender().getId());
        TripBookingResponse response = TripBookingResponse.from(
                booking,
                summary != null ? summary.averageRating() : null,
                summary != null ? summary.reviewCount() : 0L
        );
        response.setSenderPhotoUrl(fileStorageService.sanitizePublicUrl(response.getSenderPhotoUrl()));
        response.setPackagePhotoUrl(fileStorageService.sanitizePublicUrl(response.getPackagePhotoUrl()));
        return response;
    }
}
