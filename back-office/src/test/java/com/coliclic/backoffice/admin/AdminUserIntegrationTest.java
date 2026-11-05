package com.coliclic.backoffice.admin;

import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminUserIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired TripRepository trips;
    @Autowired TripBookingRepository bookings;
    @Autowired EntityManager em;

    @ParameterizedTest
    @ValueSource(strings = {"", "/1", "/1/trips", "/1/bookings"})
    void everyEndpointRequiresAdmin(String suffix) throws Exception {
        mvc.perform(request(suffix)).andExpect(status().isUnauthorized());
        mvc.perform(request(suffix).with(user("regular").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void searchesNamesAndEmailCaseInsensitivelyAndPaginatesNewestFirst() throws Exception {
        User old = account("alice@admin.test");
        old.setCreatedAt(LocalDateTime.of(2020, 1, 1, 0, 0));
        User recent = account("new@admin.test");
        recent.setFirstName("Béatrice");
        recent.setLastName("Dupont");
        recent.setGoogleSubject("private-google-subject");
        recent.setSignupConfirmToken("private-signup-token");
        recent.setEmailVerifiedAt(LocalDateTime.now());
        users.flush();
        mvc.perform(admin("").param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.items[0].id").value(recent.getId()))
                .andExpect(jsonPath("$.items[0].connectionMethods[0]").value("GOOGLE"))
                .andExpect(jsonPath("$.items[0].connectionMethods[1]").value("PASSWORD"))
                .andExpect(jsonPath("$.items[0].password").doesNotExist())
                .andExpect(jsonPath("$.items[0].googleSubject").doesNotExist())
                .andExpect(jsonPath("$.items[0].signupConfirmToken").doesNotExist());
        mvc.perform(admin("").param("size", "1").param("page", "1"))
                .andExpect(jsonPath("$.page").value(1)).andExpect(jsonPath("$.items[0].id").value(old.getId()));
        for (String query : new String[]{" BÉATRICE ", "DUPONT", "NEW@ADMIN.TEST"}) {
            mvc.perform(admin("").param("q", query)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.items[0].id").value(recent.getId()));
        }
        mvc.perform(admin("").param("q", "%"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void countsAndHistoriesIncludeEveryStatusAndOnlyTheRequestedUser() throws Exception {
        User owner = account("owner@admin.test");
        User other = account("other@admin.test");
        for (Trip.TripStatus status : Trip.TripStatus.values()) trip(owner, status);
        Trip otherTrip = trip(other, Trip.TripStatus.ACTIVE);
        for (TripBooking.BookingStatus status : TripBooking.BookingStatus.values()) booking(owner, otherTrip, status);
        booking(other, otherTrip, TripBooking.BookingStatus.PENDING);
        users.flush();
        String path = "/" + owner.getId();
        mvc.perform(admin(path)).andExpect(status().isOk())
                .andExpect(jsonPath("$.tripsCount").value(3))
                .andExpect(jsonPath("$.bookingsCount").value(6))
                .andExpect(jsonPath("$.user.verified").value(false));
        mvc.perform(admin(path + "/trips").param("size", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.items.length()").value(2));
        mvc.perform(admin(path + "/trips").param("size", "2").param("page", "1"))
                .andExpect(jsonPath("$.items.length()").value(1));
        mvc.perform(admin(path + "/bookings")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(6)).andExpect(jsonPath("$.items.length()").value(6))
                .andExpect(jsonPath("$.items[0].tripReference").value(otherTrip.getReference()))
                .andExpect(jsonPath("$.items[0].validationCode").doesNotExist())
                .andExpect(jsonPath("$.items[0].recipientContact").doesNotExist());
    }

    @Test
    void emptyHistoryAndMissingUsersHaveDistinctResponses() throws Exception {
        User owner = account("empty@admin.test");
        for (String suffix : new String[]{"", "/trips", "/bookings"}) {
            mvc.perform(admin("/9223372036854775807" + suffix)).andExpect(status().isNotFound());
        }
        for (String suffix : new String[]{"/trips", "/bookings"}) {
            mvc.perform(admin("/" + owner.getId() + suffix)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalElements").value(0)).andExpect(jsonPath("$.items").isEmpty());
        }
    }

    @Test
    void invalidPaginationReturns400() throws Exception {
        for (String[] param : new String[][]{{"page", "-1"}, {"size", "0"}, {"size", "101"}, {"page", "abc"}}) {
            mvc.perform(admin("").param(param[0], param[1])).andExpect(status().isBadRequest());
        }
    }

    @Test
    void timestampsAreCapturedOnInsertAndUpdateWithoutFabricatingLegacyHistory() throws Exception {
        User owner = account("dates@admin.test");
        users.flush();
        assertThat(owner.getUpdatedAt()).isNotNull();
        assertThat(owner.getCreatedAt()).isNotNull();
        Long id = owner.getId();
        em.createNativeQuery("update users set updated_at = null, created_at_estimated = true where id = :id")
                .setParameter("id", id).executeUpdate();
        em.clear();
        mvc.perform(admin("/" + id)).andExpect(jsonPath("$.user.updatedAt").doesNotExist())
                .andExpect(jsonPath("$.user.createdAtEstimated").value(true));
        User legacy = users.findById(id).orElseThrow();
        var createdAt = legacy.getCreatedAt();
        legacy.setLastName("Modified");
        users.flush();
        em.clear();
        User updated = users.findById(id).orElseThrow();
        assertThat(updated.getUpdatedAt()).isNotNull();
        assertThat(updated.getCreatedAt()).isEqualTo(createdAt);
        mvc.perform(admin("/" + id)).andExpect(jsonPath("$.user.updatedAt").isNotEmpty());
    }

    private MockHttpServletRequestBuilder request(String suffix) {
        String path = "/admin/users" + suffix;
        return get("/api" + path).contextPath("/api").servletPath(path);
    }
    private MockHttpServletRequestBuilder admin(String suffix) { return request(suffix).with(user("admin").roles("ADMIN")); }
    private User account(String email) {
        return users.save(User.builder().firstName("Alice").lastName("Martin").email(email).password("secret").build());
    }
    private Trip trip(User owner, Trip.TripStatus status) {
        return trips.save(Trip.builder().traveler(owner).reference("REF-" + owner.getId() + "-" + status)
                .departureAddress("Paris").destination("Abidjan").departureTime(LocalDateTime.now().plusDays(1))
                .arrivalTime(LocalDateTime.now().plusDays(2)).maxWeight(BigDecimal.TEN)
                .pricePerKilo(BigDecimal.ONE).status(status).build());
    }
    private void booking(User sender, Trip trip, TripBooking.BookingStatus status) {
        bookings.save(TripBooking.builder().sender(sender).trip(trip).title("Colis " + status)
                .recipientContact("private-contact").validationCode("123456").status(status).build());
    }
}
