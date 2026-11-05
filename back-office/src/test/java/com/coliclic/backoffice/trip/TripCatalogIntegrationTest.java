package com.coliclic.backoffice.trip;

import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    private Trip saveTrip(User traveler, Trip.TripStatus status, LocalDateTime departure) {
        return trips.save(Trip.builder().reference("CAT-" + UUID.randomUUID().toString().substring(0, 24))
                .traveler(traveler).departureAddress("CatalogCity")
                .destination("Abidjan").departureTime(departure).arrivalTime(departure.plusHours(6))
                .maxWeight(BigDecimal.valueOf(20)).pricePerKilo(BigDecimal.valueOf(5)).status(status).build());
    }
}
