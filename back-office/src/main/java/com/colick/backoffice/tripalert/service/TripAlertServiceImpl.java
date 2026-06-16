package com.colick.backoffice.tripalert.service;

import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.ResourceNotFoundException;
import com.colick.backoffice.i18n.LocalizedMessages;
import com.colick.backoffice.location.entity.LocationType;
import com.colick.backoffice.location.repository.LocationRepository;
import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.tripalert.dto.CreateTripAlertRequest;
import com.colick.backoffice.tripalert.dto.TripAlertResponse;
import com.colick.backoffice.tripalert.entity.TripAlert;
import com.colick.backoffice.tripalert.entity.TripAlertNotification;
import com.colick.backoffice.tripalert.repository.TripAlertNotificationRepository;
import com.colick.backoffice.tripalert.repository.TripAlertRepository;
import com.colick.backoffice.user.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
public class TripAlertServiceImpl implements TripAlertService {

    private final TripAlertRepository tripAlertRepository;
    private final TripAlertNotificationRepository notificationRepository;
    private final LocationRepository locationRepository;
    private final EmailService emailService;
    private final LocalizedMessages localizedMessages;
    private final String frontendBaseUrl;

    public TripAlertServiceImpl(TripAlertRepository tripAlertRepository,
                                TripAlertNotificationRepository notificationRepository,
                                LocationRepository locationRepository,
                                EmailService emailService,
                                LocalizedMessages localizedMessages,
                                @Value("${app.frontend.base-url:http://localhost:4200}") String frontendBaseUrl) {
        this.tripAlertRepository = tripAlertRepository;
        this.notificationRepository = notificationRepository;
        this.locationRepository = locationRepository;
        this.emailService = emailService;
        this.localizedMessages = localizedMessages;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public TripAlertResponse createAlert(CreateTripAlertRequest request, User user) {
        String departure = normalizeDisplayValue(request.getDeparture());
        String destination = normalizeDisplayValue(request.getDestination());
        String normalizedDeparture = normalizeSearchValue(departure);
        String normalizedDestination = normalizeSearchValue(destination);
        String sort = normalizeSort(request.getSort());

        return tripAlertRepository.findByUser(user).stream()
                .filter(alert -> alert.getNormalizedDeparture().equals(normalizedDeparture))
                .filter(alert -> alert.getNormalizedDestination().equals(normalizedDestination))
                .filter(alert -> Objects.equals(alert.getDate(), request.getDate()))
                .filter(alert -> priceEquals(alert.getMinPrice(), request.getMinPrice()))
                .filter(alert -> priceEquals(alert.getMaxPrice(), request.getMaxPrice()))
                .findFirst()
                .map(TripAlertResponse::alreadyExisting)
                .orElseGet(() -> TripAlertResponse.from(tripAlertRepository.save(TripAlert.builder()
                        .user(user)
                        .departure(departure)
                        .normalizedDeparture(normalizedDeparture)
                        .destination(destination)
                        .normalizedDestination(normalizedDestination)
                        .date(request.getDate())
                        .sort(sort)
                        .minPrice(request.getMinPrice())
                        .maxPrice(request.getMaxPrice())
                        .build())));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripAlertResponse> getMyAlerts(User user) {
        return tripAlertRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(TripAlertResponse::from)
                .toList();
    }

    @Override
    public void deleteAlert(Long alertId, User user) {
        TripAlert alert = tripAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException(localizedMessages.get("error.tripAlert.notFound", alertId)));
        if (!alert.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException(localizedMessages.get("error.auth.forbidden"));
        }
        notificationRepository.deleteByAlert(alert);
        tripAlertRepository.delete(alert);
    }

    @Override
    public void notifyMatchingAlerts(Trip trip) {
        if (trip.getStatus() != Trip.TripStatus.ACTIVE) {
            return;
        }

        for (TripAlert alert : tripAlertRepository.findAll()) {
            if (alert.getUser().getId().equals(trip.getTraveler().getId())) {
                continue;
            }
            if (notificationRepository.existsByAlertAndTrip(alert, trip)) {
                continue;
            }
            if (!matches(alert, trip)) {
                continue;
            }

            emailService.sendTripAlertMatchEmail(
                    alert.getUser().getEmail(),
                    alert.getUser().getFirstName(),
                    trip.getDepartureAddress(),
                    trip.getDestination(),
                    trip.getDepartureTime(),
                    trip.getPricePerKilo(),
                    buildSearchUrl(alert)
            );
            notificationRepository.save(TripAlertNotification.builder()
                    .alert(alert)
                    .trip(trip)
                    .sentAt(LocalDateTime.now())
                    .build());
        }
    }

    private boolean matches(TripAlert alert, Trip trip) {
        if (alert.getDate() != null && trip.getDepartureTime().toLocalDate().isBefore(alert.getDate())) {
            return false;
        }
        if (alert.getMinPrice() != null && trip.getPricePerKilo().compareTo(alert.getMinPrice()) < 0) {
            return false;
        }
        if (alert.getMaxPrice() != null && trip.getPricePerKilo().compareTo(alert.getMaxPrice()) > 0) {
            return false;
        }

        return matchesAnyTerm(trip.getDepartureAddress(), expandSearchTerm(alert.getDeparture()))
                && matchesAnyTerm(trip.getDestination(), expandSearchTerm(alert.getDestination()));
    }

    private String buildSearchUrl(TripAlert alert) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/search")
                .queryParam("from", alert.getDeparture())
                .queryParam("to", alert.getDestination())
                .queryParam("sort", alert.getSort() != null ? alert.getSort() : "price_asc");
        if (alert.getDate() != null) {
            builder.queryParam("date", alert.getDate());
        }
        if (alert.getMinPrice() != null) {
            builder.queryParam("minPrice", alert.getMinPrice());
        }
        if (alert.getMaxPrice() != null) {
            builder.queryParam("maxPrice", alert.getMaxPrice());
        }
        return builder.build().toUriString();
    }

    private Set<String> expandSearchTerm(String term) {
        Set<String> terms = new LinkedHashSet<>();
        terms.add(normalizeSearchValue(term));

        List<String> cityNames = locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, term);
        cityNames.forEach(city -> terms.add(normalizeSearchValue(city)));

        return terms;
    }

    private boolean matchesAnyTerm(String value, Set<String> terms) {
        String normalizedValue = normalizeSearchValue(value);
        return terms.stream()
                .anyMatch(term -> normalizedValue.contains(term) || term.contains(normalizedValue));
    }

    private boolean priceEquals(BigDecimal left, BigDecimal right) {
        if (left == null || right == null) {
            return left == null && right == null;
        }
        return left.compareTo(right) == 0;
    }

    private String normalizeDisplayValue(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeSearchValue(String value) {
        return normalizeDisplayValue(value).toLowerCase();
    }

    private String normalizeSort(String sort) {
        return switch (sort == null ? "" : sort) {
            case "departure_asc", "rating_desc", "price_asc" -> sort;
            default -> "price_asc";
        };
    }
}
