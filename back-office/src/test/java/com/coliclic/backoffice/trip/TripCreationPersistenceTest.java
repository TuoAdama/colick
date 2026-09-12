package com.coliclic.backoffice.trip;

import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.file.FileStorageService;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.location.repository.LocationRepository;
import com.coliclic.backoffice.trip.dto.CreateTripRequest;
import com.coliclic.backoffice.trip.dto.TripResponse;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.service.BookingValidationService;
import com.coliclic.backoffice.trip.service.TravelerReviewService;
import com.coliclic.backoffice.trip.service.TripReferenceGenerator;
import com.coliclic.backoffice.trip.service.TripServiceImpl;
import com.coliclic.backoffice.tripalert.service.TripAlertService;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import({TripServiceImpl.class, TripReferenceGenerator.class})
@Sql(statements = "CREATE SEQUENCE IF NOT EXISTS trip_reference_seq START WITH 1")
@TestPropertySource(properties = "spring.sql.init.mode=never")
class TripCreationPersistenceTest {

    @Autowired
    private TripServiceImpl tripService;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private TripBookingRepository bookingRepository;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private LocationRepository locationRepository;

    @MockitoBean
    private BookingValidationService bookingValidationService;

    @MockitoBean
    private TravelerReviewService travelerReviewService;

    @MockitoBean
    private LocalizedMessages localizedMessages;

    @MockitoBean
    private FileStorageService fileStorageService;

    @MockitoBean
    private TripAlertService tripAlertService;

    @Test
    void createTrip_shouldPersistReferenceWithInitialInsert() {
        User traveler = userRepository.saveAndFlush(User.builder()
                .firstName("Alice")
                .lastName("Dupont")
                .email("alice-trip-reference@example.com")
                .password("hashed-password")
                .build());
        CreateTripRequest request = new CreateTripRequest();
        request.setDepartureAddress("Nantes, France");
        request.setDestination("Abidjan, Côte d'Ivoire");
        request.setDepartureTime(LocalDateTime.now().plusDays(5));
        request.setArrivalTime(LocalDateTime.now().plusDays(6));
        request.setMaxWeight(BigDecimal.valueOf(20));
        request.setPricePerKilo(BigDecimal.valueOf(8));
        request.setInstantAcceptance(true);

        TripResponse response = tripService.createTrip(request, traveler);
        tripRepository.flush();

        Trip persistedTrip = tripRepository.findById(response.getId()).orElseThrow();
        assertThat(response.getReference()).matches("TRP-\\d{4}-\\d{6}");
        assertThat(persistedTrip.getReference()).isEqualTo(response.getReference());
    }
}
