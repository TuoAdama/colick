package com.coliclic.backoffice.trip;

import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.ConflictException;
import com.coliclic.backoffice.exception.InvalidValidationCodeException;
import com.coliclic.backoffice.exception.TooManyRequestsException;
import com.coliclic.backoffice.parcelguidelines.ParcelGuidelines;
import com.coliclic.backoffice.trip.dto.ConfirmBookingDeliveryRequest;
import com.coliclic.backoffice.trip.dto.CreateBookingRequest;
import com.coliclic.backoffice.trip.dto.UpdateTripRequest;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.service.TripService;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingSecurityIntegrationTest {
    @Autowired TripService service;
    @Autowired TripRepository trips;
    @Autowired TripBookingRepository bookings;
    @Autowired UserRepository users;
    @Autowired PlatformTransactionManager transactions;
    @Autowired MockMvc mvc;
    @Autowired JwtUtil jwt;
    @MockitoBean EmailService emailService;
    private User traveler;
    private User sender;
    private User otherSender;
    private Trip trip;

    @BeforeEach
    void fixtures() {
        traveler = account(); sender = account(); otherSender = account();
        trip = trips.saveAndFlush(Trip.builder().reference("SEC-" + UUID.randomUUID().toString().substring(0, 8))
                .traveler(traveler).departureAddress("Paris").destination("Abidjan")
                .departureTime(LocalDateTime.now().minusDays(2)).arrivalTime(LocalDateTime.now().minusDays(1))
                .maxWeight(BigDecimal.TEN).pricePerKilo(BigDecimal.ONE).build());
    }

    @AfterEach
    void cleanup() {
        new TransactionTemplate(transactions).executeWithoutResult(status -> {
            bookings.deleteAll(bookings.findByTrip(trip));
            trips.deleteById(trip.getId());
            users.deleteAllById(List.of(traveler.getId(), sender.getId(), otherSender.getId()));
        });
    }

    @Test
    void successiveAcceptancesCannotExceedCapacity() {
        TripBooking first = booking(sender, TripBooking.BookingStatus.PENDING);
        TripBooking second = booking(otherSender, TripBooking.BookingStatus.PENDING);
        service.acceptBooking(trip.getId(), first.getId(), traveler);
        assertThatThrownBy(() -> service.acceptBooking(trip.getId(), second.getId(), traveler))
                .isInstanceOf(ConflictException.class);
        assertThat(bookings.findById(second.getId()).orElseThrow().getStatus()).isEqualTo(TripBooking.BookingStatus.PENDING);
    }

    @Test
    void simultaneousAcceptancesCannotExceedCapacity() throws Exception {
        TripBooking first = booking(sender, TripBooking.BookingStatus.PENDING);
        TripBooking second = booking(otherSender, TripBooking.BookingStatus.PENDING);
        List<String> outcomes = concurrently(List.of(
                () -> acceptOutcome(first.getId()), () -> acceptOutcome(second.getId())));
        assertThat(outcomes).containsExactlyInAnyOrder("accepted", "capacity-rejected");
        assertThat(bookings.findByTripAndStatus(trip, TripBooking.BookingStatus.ACCEPTED)).hasSize(1);
    }

    @Test
    void simultaneousInstantBookingsCannotExceedCapacity() throws Exception {
        trip.setInstantAcceptance(true); trips.saveAndFlush(trip);
        List<String> outcomes = concurrently(List.of(() -> instantOutcome(sender), () -> instantOutcome(otherSender)));
        assertThat(outcomes).containsExactlyInAnyOrder("accepted", "capacity-rejected");
        assertThat(bookings.findByTripAndStatus(trip, TripBooking.BookingStatus.ACCEPTED)).hasSize(1);
    }

    @Test
    void acceptedCapacityCannotBeRemovedByEditingTrip() {
        booking(sender, TripBooking.BookingStatus.ACCEPTED);
        UpdateTripRequest update = new UpdateTripRequest(); update.setMaxWeight(BigDecimal.ONE);
        assertThatThrownBy(() -> service.updateTrip(trip.getId(), update, traveler)).isInstanceOf(ConflictException.class);
        assertThat(trips.findById(trip.getId()).orElseThrow().getMaxWeight()).isEqualByComparingTo(BigDecimal.TEN);
    }

    @Test
    void expiredAndUndatedLegacyCodesAreRejected() {
        trip.setStatus(Trip.TripStatus.COMPLETED); trips.saveAndFlush(trip);
        TripBooking booking = booking(sender, TripBooking.BookingStatus.ACCEPTED);
        booking.setValidationCodeExpiresAt(LocalDateTime.now().minusSeconds(1)); bookings.saveAndFlush(booking);
        assertThatThrownBy(() -> deliver(booking.getId(), "123456")).isInstanceOf(ConflictException.class);
        booking.setValidationCodeExpiresAt(null); booking.setValidationCodeSentAt(null); bookings.saveAndFlush(booking);
        assertThatThrownBy(() -> deliver(booking.getId(), "123456")).isInstanceOf(ConflictException.class);
    }

    @Test
    void wrongHttpAttemptsRemainPersistedAndEvenCorrectCodeIsBlockedAtThreshold() throws Exception {
        trip.setStatus(Trip.TripStatus.COMPLETED); trips.saveAndFlush(trip);
        TripBooking booking = booking(sender, TripBooking.BookingStatus.ACCEPTED);
        String path = "/trips/" + trip.getId() + "/bookings/" + booking.getId() + "/deliver";
        Cookie cookie = new Cookie("COLICLIC_AUTH", jwt.generateToken(traveler));
        for (int i = 1; i <= 5; i++) {
            mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).cookie(cookie).with(csrf())
                            .contentType("application/json").content("{\"validationCode\":\"000000\"}"))
                    .andExpect(status().isBadRequest());
            assertThat(bookings.findById(booking.getId()).orElseThrow().getValidationCodeFailedAttempts()).isEqualTo(i);
        }
        mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).cookie(cookie).with(csrf())
                        .contentType("application/json").content("{\"validationCode\":\"123456\"}"))
                .andExpect(status().isTooManyRequests()).andExpect(header().exists("Retry-After"));
        TripBooking blocked = bookings.findById(booking.getId()).orElseThrow();
        assertThat(blocked.getStatus()).isEqualTo(TripBooking.BookingStatus.ACCEPTED);
        blocked.setValidationCodeBlockedUntil(LocalDateTime.now().minusSeconds(1)); bookings.saveAndFlush(blocked);
        deliver(blocked.getId(), "123456");
        assertThat(bookings.findById(booking.getId()).orElseThrow().getStatus()).isEqualTo(TripBooking.BookingStatus.DELIVERED);
    }

    @Test
    void simultaneousWrongAttemptsCannotBypassCounter() throws Exception {
        trip.setStatus(Trip.TripStatus.COMPLETED); trips.saveAndFlush(trip);
        TripBooking booking = booking(sender, TripBooking.BookingStatus.ACCEPTED);
        List<Callable<String>> tasks = new ArrayList<>();
        for (int i = 0; i < 10; i++) tasks.add(() -> {
            try { deliver(booking.getId(), "000000"); return "delivered"; }
            catch (InvalidValidationCodeException ex) { return "counted"; }
            catch (TooManyRequestsException ex) { return "blocked"; }
        });
        List<String> outcomes = concurrently(tasks);
        assertThat(outcomes.stream().filter("counted"::equals).count()).isEqualTo(5);
        assertThat(outcomes.stream().filter("blocked"::equals).count()).isEqualTo(5);
        TripBooking persisted = bookings.findById(booking.getId()).orElseThrow();
        assertThat(persisted.getValidationCodeFailedAttempts()).isEqualTo(5);
        assertThat(persisted.getValidationCodeBlockedUntil()).isAfter(LocalDateTime.now());
    }

    private String acceptOutcome(Long bookingId) {
        try { service.acceptBooking(trip.getId(), bookingId, traveler); return "accepted"; }
        catch (ConflictException ex) { return "capacity-rejected"; }
    }
    private String instantOutcome(User sender) {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTitle("Documents"); request.setWeight(BigDecimal.TEN); request.setRecipientContact("recipient@example.com");
        request.setParcelPolicyAccepted(true); request.setParcelPolicyVersion(ParcelGuidelines.VERSION);
        try { service.createBooking(trip.getId(), request, sender); return "accepted"; }
        catch (com.coliclic.backoffice.exception.BadRequestException ex) { return "capacity-rejected"; }
    }
    private void deliver(Long bookingId, String code) {
        ConfirmBookingDeliveryRequest request = new ConfirmBookingDeliveryRequest(); request.setValidationCode(code);
        service.confirmBookingDelivery(trip.getId(), bookingId, request, traveler);
    }
    private List<String> concurrently(List<Callable<String>> tasks) throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(tasks.size())) {
            var futures = tasks.stream().map(task -> executor.submit(() -> {
                if (!start.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("Start latch timed out");
                return task.call();
            })).toList();
            start.countDown();
            List<String> outcomes = new ArrayList<>();
            for (var future : futures) outcomes.add(future.get(20, TimeUnit.SECONDS));
            return outcomes;
        }
    }
    private User account() {
        return users.saveAndFlush(User.builder().firstName("Test").lastName("Security")
                .email(UUID.randomUUID() + "@booking-security.test").password("unused").build());
    }
    private TripBooking booking(User sender, TripBooking.BookingStatus status) {
        return bookings.saveAndFlush(TripBooking.builder().trip(trip).sender(sender).title("Documents")
                .recipientContact("recipient@example.com").weight(BigDecimal.TEN).status(status)
                .validationCode("123456").validationDeliveryStatus(TripBooking.ValidationDeliveryStatus.DELIVERED)
                .validationCodeSentAt(LocalDateTime.now()).build());
    }
}
