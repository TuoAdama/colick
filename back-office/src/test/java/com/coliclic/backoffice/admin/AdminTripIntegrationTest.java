package com.coliclic.backoffice.admin;

import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.file.FileStorageService;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminTripIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired TripRepository trips;
    @Autowired TripBookingRepository bookings;
    @Autowired EntityManager em;
    @MockitoBean EmailService email;
    @MockitoBean FileStorageService storage;
    @TempDir Path photos;

    @ParameterizedTest
    @ValueSource(strings = {"", "/1", "/1/bookings", "/1/bookings/1", "/1/bookings/1/photo"})
    void readsRequireAnAdministrator(String suffix) throws Exception {
        mvc.perform(adminRequest(HttpMethod.GET, suffix)).andExpect(status().isUnauthorized());
        mvc.perform(adminRequest(HttpMethod.GET, suffix).with(user("member").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void paginatesAllPublicationsByCreationThenIdAndPlacesMissingDatesLast() throws Exception {
        User traveler = account("traveler");
        Trip legacy = trip(traveler, "LEGACY", Trip.TripStatus.ACTIVE, LocalDateTime.now());
        LocalDateTime publication = LocalDateTime.of(2026, 1, 1, 10, 0);
        Trip first = trip(traveler, "FIRST", Trip.TripStatus.COMPLETED, publication);
        Trip second = trip(traveler, "SECOND", Trip.TripStatus.CANCELLED, publication);
        Trip older = trip(traveler, "OLDER", Trip.TripStatus.ACTIVE, publication.minusDays(1));
        em.flush();
        em.createNativeQuery("update trips set created_at = null where id = :id")
                .setParameter("id", legacy.getId()).executeUpdate();
        em.clear();

        mvc.perform(read("").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.totalPages").value(4))
                .andExpect(jsonPath("$.items[0].trip.id").value(second.getId()))
                .andExpect(jsonPath("$.items[0].trip.status").value("CANCELLED"))
                .andExpect(jsonPath("$.items[0].travelerId").value(traveler.getId()));
        mvc.perform(read("").param("size", "1").param("page", "1"))
                .andExpect(jsonPath("$.items[0].trip.id").value(first.getId()));
        mvc.perform(read("").param("size", "1").param("page", "2"))
                .andExpect(jsonPath("$.items[0].trip.id").value(older.getId()));
        mvc.perform(read("").param("size", "1").param("page", "3"))
                .andExpect(jsonPath("$.items[0].trip.id").value(legacy.getId()))
                .andExpect(jsonPath("$.items[0].createdAt").doesNotExist());
        mvc.perform(read("").param("size", "2").param("sort", "created_asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].trip.id").value(older.getId()))
                .andExpect(jsonPath("$.items[1].trip.id").value(second.getId()));
        mvc.perform(read("").param("size", "2").param("sort", "created_asc").param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].trip.id").value(first.getId()))
                .andExpect(jsonPath("$.items[1].trip.id").value(legacy.getId()));
        mvc.perform(read("").param("page", "4").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items").isEmpty());
        mvc.perform(read("").param("page", "-1")).andExpect(status().isBadRequest());
        mvc.perform(read("").param("size", "101")).andExpect(status().isBadRequest());
        mvc.perform(read("").param("page", "invalid")).andExpect(status().isBadRequest());
        mvc.perform(read("").param("sort", "departure_asc")).andExpect(status().isBadRequest());
        mvc.perform(read("").param("sort", "")).andExpect(status().isBadRequest());
    }

    @Test
    void filtersByCreationDateAndTravelerNameOrReferenceBeforePagination() throws Exception {
        User martin = account("Martin");
        User durand = account("Durand");
        var start = LocalDateTime.of(2026, 1, 10, 0, 0);
        Trip boundary = trip(martin, "ABC-100", Trip.TripStatus.ACTIVE, start);
        Trip newer = trip(martin, "XYZ-200", Trip.TripStatus.CANCELLED, start.plusDays(1));
        trip(martin, "OLD", Trip.TripStatus.ACTIVE, start.minusSeconds(1));
        Trip legacy = trip(martin, "UNKNOWN", Trip.TripStatus.ACTIVE, start.plusDays(2));
        trip(durand, "OTHER", Trip.TripStatus.ACTIVE, start.plusDays(3));
        em.flush();
        em.createNativeQuery("update trips set created_at = null where id = :id")
                .setParameter("id", legacy.getId()).executeUpdate();
        em.clear();

        mvc.perform(read("").param("createdFrom", "2026-01-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
        mvc.perform(read("").param("q", "  aDA mar "))
                .andExpect(jsonPath("$.totalElements").value(4));
        mvc.perform(read("").param("q", "bc-10"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].trip.id").value(boundary.getId()));
        mvc.perform(read("").param("createdFrom", "2026-01-10").param("q", "martin").param("size", "1"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items[0].trip.id").value(newer.getId()));
        mvc.perform(read("").param("createdFrom", "2026-01-10").param("q", "martin").param("size", "1").param("page", "1"))
                .andExpect(jsonPath("$.items[0].trip.id").value(boundary.getId()));
        mvc.perform(read("").param("createdFrom", "2026-02-30")).andExpect(status().isBadRequest());
    }

    @Test
    void exposesTripDetailsAndOnlyBookingsAssociatedWithThatTrip() throws Exception {
        User traveler = account("traveler");
        User sender = account("sender");
        Trip trip = trip(traveler, "ACTIVE", Trip.TripStatus.ACTIVE, LocalDateTime.now());
        Trip other = trip(traveler, "OTHER", Trip.TripStatus.ACTIVE, LocalDateTime.now());
        TripBooking pending = booking(sender, trip, TripBooking.BookingStatus.PENDING);
        TripBooking accepted = booking(sender, trip, TripBooking.BookingStatus.ACCEPTED);
        booking(sender, trip, TripBooking.BookingStatus.REMOVED);
        TripBooking unrelated = booking(sender, other, TripBooking.BookingStatus.PENDING);
        String path = "/" + trip.getId();

        mvc.perform(read(path))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publication.trip.reference").value("ACTIVE"))
                .andExpect(jsonPath("$.publication.travelerName").value("Ada traveler"))
                .andExpect(jsonPath("$.meetingPoint").value("Gare du Nord"))
                .andExpect(jsonPath("$.instantAcceptance").value(true))
                .andExpect(jsonPath("$.availableWeight").value(8));
        mvc.perform(read(path + "/bookings").param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.items[0].status").value("REMOVED"))
                .andExpect(jsonPath("$.items[1].id").value(accepted.getId()))
                .andExpect(jsonPath("$.items[0].recipientContact").doesNotExist());
        mvc.perform(read(path + "/bookings").param("size", "2").param("page", "1"))
                .andExpect(jsonPath("$.items[0].id").value(pending.getId()));
        mvc.perform(read(path + "/bookings/" + unrelated.getId())).andExpect(status().isNotFound());
        mvc.perform(read(path + "/bookings/" + unrelated.getId() + "/photo")).andExpect(status().isNotFound());
        mvc.perform(read("/9223372036854775807")).andExpect(status().isNotFound());
        mvc.perform(read("/9223372036854775807/bookings")).andExpect(status().isNotFound());
    }

    @Test
    void allowsAnAdminToReadPrivateBookingDetailsAndPhotoForHistoricalBookings() throws Exception {
        User traveler = account("traveler");
        User sender = account("sender");
        Trip trip = trip(traveler, "HISTORY", Trip.TripStatus.COMPLETED, LocalDateTime.now());
        TripBooking removed = booking(sender, trip, TripBooking.BookingStatus.REMOVED);
        removed.setPackagePhotoUrl("private-photo-reference");
        byte[] photoContent = {1, 2, 3};
        Path photo = Files.write(photos.resolve("photo.png"), photoContent);
        when(storage.findBookingPhoto("private-photo-reference")).thenReturn(photo);
        String path = "/" + trip.getId() + "/bookings/" + removed.getId();

        mvc.perform(read(path))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("private")))
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.booking.senderId").value(sender.getId()))
                .andExpect(jsonPath("$.description").value("Documents imprimés"))
                .andExpect(jsonPath("$.recipientContact").value("recipient@example.test"))
                .andExpect(jsonPath("$.hasPhoto").value(true))
                .andExpect(jsonPath("$.packagePhotoUrl").doesNotExist())
                .andExpect(jsonPath("$.validationCode").doesNotExist())
                .andExpect(jsonPath("$.booking.validationCode").doesNotExist());
        mvc.perform(read(path + "/photo"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(photoContent));
        mvc.perform(adminRequest(HttpMethod.GET, path + "/photo").with(user("sender").roles("USER")))
                .andExpect(status().isForbidden());

        when(storage.findBookingPhoto("private-photo-reference")).thenReturn(null);
        mvc.perform(read(path)).andExpect(jsonPath("$.hasPhoto").value(false));
        mvc.perform(read(path + "/photo")).andExpect(status().isNotFound());
    }

    @Test
    void cancellingRequiresAdminAndCsrfAndPreservesHistory() throws Exception {
        User traveler = account("traveler");
        User pendingSender = account("pending");
        User acceptedSender = account("accepted");
        User declinedSender = account("declined");
        Trip trip = trip(traveler, "TO-CANCEL", Trip.TripStatus.ACTIVE, LocalDateTime.now());
        Trip completed = trip(traveler, "COMPLETED", Trip.TripStatus.COMPLETED, LocalDateTime.now());
        TripBooking pending = booking(pendingSender, trip, TripBooking.BookingStatus.PENDING);
        TripBooking accepted = booking(acceptedSender, trip, TripBooking.BookingStatus.ACCEPTED);
        TripBooking declined = booking(declinedSender, trip, TripBooking.BookingStatus.REJECTED);
        accepted.setValidationDeliveryStatus(TripBooking.ValidationDeliveryStatus.DELIVERED);
        accepted.setValidationCodeExpiresAt(LocalDateTime.now().plusDays(1));
        em.flush();
        String path = "/" + trip.getId();
        mvc.perform(adminRequest(HttpMethod.DELETE, path).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(adminRequest(HttpMethod.DELETE, path).with(user("traveler").roles("USER")).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(remove(path)).andExpect(status().isForbidden());
        mvc.perform(remove(path).with(csrf())).andExpect(status().isNoContent());
        em.flush();
        em.clear();

        mvc.perform(read(path))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publication.trip.status").value("CANCELLED"))
                .andExpect(jsonPath("$.availableWeight").doesNotExist());
        mvc.perform(read(path + "/bookings")).andExpect(jsonPath("$.totalElements").value(3));
        assertThat(bookings.findById(pending.getId()).orElseThrow().getStatus()).isEqualTo(TripBooking.BookingStatus.PENDING);
        assertThat(bookings.findById(declined.getId()).orElseThrow().getStatus()).isEqualTo(TripBooking.BookingStatus.REJECTED);
        TripBooking acceptedAfter = bookings.findById(accepted.getId()).orElseThrow();
        assertThat(acceptedAfter.getStatus()).isEqualTo(TripBooking.BookingStatus.ACCEPTED);
        assertThat(acceptedAfter.getValidationDeliveryStatus()).isEqualTo(TripBooking.ValidationDeliveryStatus.INVALIDATED);
        assertThat(trips.findByReferenceIgnoreCaseAndStatus(trip.getReference(), Trip.TripStatus.ACTIVE)).isEmpty();
        mvc.perform(remove(path).with(csrf())).andExpect(status().isConflict());
        mvc.perform(remove("/" + completed.getId()).with(csrf())).andExpect(status().isConflict());
        mvc.perform(remove("/9223372036854775807").with(csrf())).andExpect(status().isNotFound());
        verify(email).sendTripCancelledEmail(pendingSender.getEmail(), "Ada", "Paris", "Abidjan");
        verify(email).sendTripCancelledEmail(acceptedSender.getEmail(), "Ada", "Paris", "Abidjan");
        verifyNoMoreInteractions(email);
    }

    private MockHttpServletRequestBuilder adminRequest(HttpMethod method, String suffix) {
        String path = "/admin/trips" + suffix;
        return request(method, "/api" + path).contextPath("/api").servletPath(path);
    }

    private MockHttpServletRequestBuilder read(String suffix) {
        return adminRequest(HttpMethod.GET, suffix).with(user("admin").roles("ADMIN"));
    }

    private MockHttpServletRequestBuilder remove(String suffix) {
        User admin = User.builder().id(0L).role(User.Role.ADMIN).build();
        return adminRequest(HttpMethod.DELETE, suffix).with(authentication(new UsernamePasswordAuthenticationToken(
                admin, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))));
    }

    private User account(String name) {
        return users.save(User.builder().firstName("Ada").lastName(name).email(name + "@admin.test").password("secret").build());
    }

    private Trip trip(User traveler, String reference, Trip.TripStatus status, LocalDateTime createdAt) {
        return trips.save(Trip.builder().traveler(traveler).reference(reference).departureAddress("Paris")
                .destination("Abidjan").meetingPoint("Gare du Nord").departureTime(createdAt.plusDays(1))
                .arrivalTime(createdAt.plusDays(2)).maxWeight(BigDecimal.TEN).pricePerKilo(BigDecimal.ONE)
                .instantAcceptance(true).status(status).createdAt(createdAt).build());
    }

    private TripBooking booking(User sender, Trip trip, TripBooking.BookingStatus status) {
        return bookings.save(TripBooking.builder().sender(sender).trip(trip).title("Colis " + status)
                .description("Documents imprimés").weight(BigDecimal.valueOf(2)).recipientContact("recipient@example.test")
                .validationCode("123456").status(status).build());
    }
}
