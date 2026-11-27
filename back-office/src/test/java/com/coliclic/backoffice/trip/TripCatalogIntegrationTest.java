package com.coliclic.backoffice.trip;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TripCatalogIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private TripRepository trips;
    @Autowired private UserRepository users;
    @Autowired private TripBookingRepository bookings;
    @Autowired private EntityManager entityManager;
    @Autowired private JwtUtil jwt;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void anonymousCatalogueShouldReturnOnlyActiveUpcomingTripsAndPagination() throws Exception {
        User traveler = users.save(User.builder().firstName("Alice").lastName("Catalog")
                .email("catalog@example.test").password("unused").build());
        Trip available = saveTrip(traveler, Trip.TripStatus.ACTIVE, LocalDateTime.now().plusDays(2));
        saveTrip(traveler, Trip.TripStatus.CANCELLED, LocalDateTime.now().plusDays(1));
        saveTrip(traveler, Trip.TripStatus.COMPLETED, LocalDateTime.now().plusDays(1));
        saveTrip(traveler, Trip.TripStatus.ACTIVE, LocalDateTime.now().minusDays(1));
        saveTrip(traveler, Trip.TripStatus.ACTIVE, LocalDateTime.now().plusDays(3));
        Trip full = saveTrip(traveler, Trip.TripStatus.ACTIVE, LocalDateTime.now().plusDays(1));
        bookings.save(TripBooking.builder().trip(full).sender(traveler).title("Documents")
                .recipientContact("recipient@example.test").weight(BigDecimal.valueOf(20))
                .status(TripBooking.BookingStatus.ACCEPTED).build());

        mvc.perform(get("/api/trips/catalog").contextPath("/api").servletPath("/trips/catalog")
                        .queryParam("departure", "CatalogCity").queryParam("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(available.getId()))
                .andExpect(jsonPath("$.items[0].availableWeight").value(20))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.hasNext").value(true));
    }

    @Test
    void catalogueShouldNotRequireAnyCityAndValidatePagination() throws Exception {
        mvc.perform(get("/api/trips/catalog").contextPath("/api").servletPath("/trips/catalog"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.size").value(20));
        mvc.perform(get("/api/trips/catalog").contextPath("/api").servletPath("/trips/catalog")
                        .queryParam("page", "-1"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/trips/search").contextPath("/api").servletPath("/trips/search"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Sql(statements = "CREATE SEQUENCE IF NOT EXISTS trip_reference_seq START WITH 1")
    void travelerCanPublishUpdateAndClearThePublicMeetingPoint() throws Exception {
        User traveler = users.save(User.builder().firstName("Alice").lastName("Dupont")
                .email("meeting-point@example.test").password("unused").build());
        Cookie auth = new Cookie("COLICLIC_AUTH", jwt.generateToken(traveler));
        String newTrip = """
                {
                    "departureAddress": "Paris, France",
                    "destination": "Abidjan, Côte d'Ivoire",
                    "departureTime": "%s",
                    "arrivalTime": "%s",
                    "maxWeight": 20,
                    "pricePerKilo": 8,
                    "meetingPoint": "%s"
                }
                """;
        LocalDateTime departure = LocalDateTime.now().plusDays(3).withNano(0);
        LocalDateTime arrival = departure.plusHours(7);

        mvc.perform(post("/api/trips").contextPath("/api").servletPath("/trips").with(csrf()).cookie(auth)
                        .contentType(APPLICATION_JSON).content(newTrip.formatted(departure, arrival, "A".repeat(256))))
                .andExpect(status().isBadRequest());

        byte[] created = mvc.perform(post("/api/trips").contextPath("/api").servletPath("/trips")
                        .with(csrf()).cookie(auth).contentType(APPLICATION_JSON)
                        .content(newTrip.formatted(departure, arrival, "  Gare de Lyon, hall 2  ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.meetingPoint").value("Gare de Lyon, hall 2"))
                .andReturn().getResponse().getContentAsByteArray();
        var trip = objectMapper.readTree(created);
        String publicPath = "/trips/reference/" + trip.path("reference").asText();
        String editPath = "/trips/" + trip.path("id").asLong();
        entityManager.flush();
        entityManager.clear();

        mvc.perform(get("/api" + publicPath).contextPath("/api").servletPath(publicPath))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingPoint").value("Gare de Lyon, hall 2"));

        mvc.perform(put("/api" + editPath).contextPath("/api").servletPath(editPath).with(csrf()).cookie(auth)
                        .contentType(APPLICATION_JSON).content("{\"meetingPoint\":\"" + "A".repeat(256) + "\"}"))
                .andExpect(status().isBadRequest());

        for (String edit : new String[]{"{\"pricePerKilo\":9}", "{\"meetingPoint\":null}"}) {
            mvc.perform(put("/api" + editPath).contextPath("/api").servletPath(editPath).with(csrf()).cookie(auth)
                            .contentType(APPLICATION_JSON).content(edit))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.meetingPoint").value("Gare de Lyon, hall 2"));
        }

        mvc.perform(put("/api" + editPath).contextPath("/api").servletPath(editPath).with(csrf()).cookie(auth)
                        .contentType(APPLICATION_JSON).content("""
                                {"meetingPoint":"  Gare de Lyon, hall 3 "}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingPoint").value("Gare de Lyon, hall 3"));

        mvc.perform(put("/api" + editPath).contextPath("/api").servletPath(editPath).with(csrf()).cookie(auth)
                        .contentType(APPLICATION_JSON).content("""
                                {"meetingPoint":"   "}
                                """))
                .andExpect(status().isOk());
        entityManager.flush();
        entityManager.clear();

        mvc.perform(get("/api" + publicPath).contextPath("/api").servletPath(publicPath))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meetingPoint").doesNotExist());
    }

    private Trip saveTrip(User traveler, Trip.TripStatus status, LocalDateTime departure) {
        return trips.save(Trip.builder().reference("CAT-" + UUID.randomUUID().toString().substring(0, 24))
                .traveler(traveler).departureAddress("CatalogCity")
                .destination("Abidjan").departureTime(departure).arrivalTime(departure.plusHours(6))
                .maxWeight(BigDecimal.valueOf(20)).pricePerKilo(BigDecimal.valueOf(5)).status(status).build());
    }
}
