package com.coliclic.backoffice.tripalert;

import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.location.entity.LocationType;
import com.coliclic.backoffice.location.repository.LocationRepository;
import com.coliclic.backoffice.support.TestLocalizedMessages;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.tripalert.dto.CreateTripAlertRequest;
import com.coliclic.backoffice.tripalert.dto.TripAlertResponse;
import com.coliclic.backoffice.tripalert.entity.TripAlert;
import com.coliclic.backoffice.tripalert.entity.TripAlertNotification;
import com.coliclic.backoffice.tripalert.repository.TripAlertNotificationRepository;
import com.coliclic.backoffice.tripalert.repository.TripAlertRepository;
import com.coliclic.backoffice.tripalert.service.TripAlertServiceImpl;
import com.coliclic.backoffice.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripAlertServiceImplTest {

    @Mock
    private TripAlertRepository tripAlertRepository;

    @Mock
    private TripAlertNotificationRepository notificationRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private EmailService emailService;

    private final LocalizedMessages localizedMessages = TestLocalizedMessages.create();

    private TripAlertServiceImpl service;
    private User sender;
    private User traveler;

    @BeforeEach
    void setUp() {
        service = new TripAlertServiceImpl(
                tripAlertRepository,
                notificationRepository,
                locationRepository,
                emailService,
                localizedMessages,
                "http://localhost:4200"
        );

        sender = User.builder()
                .id(1L)
                .firstName("Bob")
                .lastName("Martin")
                .email("bob@example.com")
                .role(User.Role.USER)
                .build();
        traveler = User.builder()
                .id(2L)
                .firstName("Alice")
                .lastName("Dupont")
                .email("alice@example.com")
                .role(User.Role.USER)
                .build();
    }

    @Test
    void createAlert_shouldSaveAlertWithNormalizedCriteria() {
        CreateTripAlertRequest request = request("  Paris  ", " Abidjan ");
        when(tripAlertRepository.findByUser(sender)).thenReturn(List.of());
        when(tripAlertRepository.save(any(TripAlert.class))).thenAnswer(invocation -> {
            TripAlert alert = invocation.getArgument(0);
            alert.setId(10L);
            return alert;
        });

        TripAlertResponse response = service.createAlert(request, sender);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getDeparture()).isEqualTo("Paris");
        assertThat(response.getDestination()).isEqualTo("Abidjan");
        verify(tripAlertRepository).save(argThat(alert ->
                alert.getNormalizedDeparture().equals("paris")
                        && alert.getNormalizedDestination().equals("abidjan")
        ));
    }

    @Test
    void createAlert_shouldReturnExistingAlertForSameUserAndCriteria() {
        CreateTripAlertRequest request = request("Paris", "Abidjan");
        TripAlert existing = alert(5L, sender, "Paris", "Abidjan");
        when(tripAlertRepository.findByUser(sender)).thenReturn(List.of(existing));

        TripAlertResponse response = service.createAlert(request, sender);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.isAlreadyExists()).isTrue();
        verify(tripAlertRepository, never()).save(any());
    }

    @Test
    void deleteAlert_shouldDeleteOwnedAlertAndNotifications() {
        TripAlert alert = alert(5L, sender, "Paris", "Abidjan");
        when(tripAlertRepository.findById(5L)).thenReturn(Optional.of(alert));

        service.deleteAlert(5L, sender);

        verify(notificationRepository).deleteByAlert(alert);
        verify(tripAlertRepository).delete(alert);
    }

    @Test
    void deleteAlert_shouldRejectOtherUsersAlert() {
        TripAlert alert = alert(5L, sender, "Paris", "Abidjan");
        when(tripAlertRepository.findById(5L)).thenReturn(Optional.of(alert));

        assertThatThrownBy(() -> service.deleteAlert(5L, traveler))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void deleteAlert_shouldThrowWhenAlertIsMissing() {
        when(tripAlertRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteAlert(99L, sender))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void notifyMatchingAlerts_shouldSendEmailAndRecordNotification() {
        TripAlert alert = alert(5L, sender, "Paris", "Abidjan");
        Trip trip = trip("Paris 10", "Abidjan", traveler);
        when(tripAlertRepository.findAll()).thenReturn(List.of(alert));
        when(notificationRepository.existsByAlertAndTrip(alert, trip)).thenReturn(false);
        when(locationRepository.findNamesByTypeAndCountryContaining(eq(LocationType.CITY), anyString()))
                .thenReturn(List.of());

        service.notifyMatchingAlerts(trip);

        verify(emailService).sendTripAlertMatchEmail(
                eq("bob@example.com"),
                eq("Bob"),
                eq("Paris 10"),
                eq("Abidjan"),
                eq(trip.getDepartureTime()),
                eq(trip.getPricePerKilo()),
                contains("/search?from=Paris&to=Abidjan")
        );
        verify(notificationRepository).save(any(TripAlertNotification.class));
    }

    @Test
    void notifyMatchingAlerts_shouldSkipNonMatchingOwnAndAlreadyNotifiedAlerts() {
        TripAlert ownAlert = alert(1L, traveler, "Paris", "Abidjan");
        TripAlert notifiedAlert = alert(2L, sender, "Paris", "Abidjan");
        TripAlert nonMatchingAlert = alert(3L, sender, "Lyon", "Dakar");
        Trip trip = trip("Paris", "Abidjan", traveler);
        when(tripAlertRepository.findAll()).thenReturn(List.of(ownAlert, notifiedAlert, nonMatchingAlert));
        when(notificationRepository.existsByAlertAndTrip(notifiedAlert, trip)).thenReturn(true);
        when(notificationRepository.existsByAlertAndTrip(nonMatchingAlert, trip)).thenReturn(false);
        when(locationRepository.findNamesByTypeAndCountryContaining(eq(LocationType.CITY), anyString()))
                .thenReturn(List.of());

        service.notifyMatchingAlerts(trip);

        verify(emailService, never()).sendTripAlertMatchEmail(anyString(), anyString(), anyString(), anyString(), any(), any(), anyString());
        verify(notificationRepository, never()).save(any());
    }

    private CreateTripAlertRequest request(String departure, String destination) {
        CreateTripAlertRequest request = new CreateTripAlertRequest();
        request.setDeparture(departure);
        request.setDestination(destination);
        request.setDate(LocalDate.now().plusDays(1));
        request.setSort("price_asc");
        request.setMinPrice(BigDecimal.valueOf(5));
        request.setMaxPrice(BigDecimal.valueOf(15));
        return request;
    }

    private TripAlert alert(Long id, User user, String departure, String destination) {
        return TripAlert.builder()
                .id(id)
                .user(user)
                .departure(departure)
                .normalizedDeparture(departure.toLowerCase())
                .destination(destination)
                .normalizedDestination(destination.toLowerCase())
                .date(LocalDate.now().plusDays(1))
                .sort("price_asc")
                .minPrice(BigDecimal.valueOf(5))
                .maxPrice(BigDecimal.valueOf(15))
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Trip trip(String departure, String destination, User traveler) {
        return Trip.builder()
                .id(20L)
                .traveler(traveler)
                .departureAddress(departure)
                .destination(destination)
                .departureTime(LocalDateTime.now().plusDays(2))
                .arrivalTime(LocalDateTime.now().plusDays(3))
                .maxWeight(BigDecimal.valueOf(20))
                .pricePerKilo(BigDecimal.valueOf(10))
                .status(Trip.TripStatus.ACTIVE)
                .build();
    }
}
