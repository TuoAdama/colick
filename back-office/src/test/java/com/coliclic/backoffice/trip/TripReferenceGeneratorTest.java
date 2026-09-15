package com.coliclic.backoffice.trip;

import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.service.TripReferenceGenerator;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TripReferenceGeneratorTest {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final TripReferenceGenerator generator = new TripReferenceGenerator(jdbcTemplate);

    @Test
    void generateForNewTrip_shouldUseCreatedYearAndSequenceValue() {
        Trip trip = Trip.builder()
                .createdAt(LocalDateTime.of(2026, 8, 19, 10, 0))
                .build();
        when(jdbcTemplate.queryForObject("SELECT nextval('trip_reference_seq')", Long.class))
                .thenReturn(27L);

        assertThat(generator.generateForNewTrip(trip)).isEqualTo("TRP-2026-000027");
    }

    @Test
    void generate_shouldUseCreatedYearAndPaddedTripId() {
        Trip trip = Trip.builder()
                .id(13L)
                .createdAt(LocalDateTime.of(2026, 6, 27, 10, 0))
                .build();

        assertThat(generator.generate(trip)).isEqualTo("TRP-2026-000013");
    }

    @Test
    void generate_shouldFallBackToDepartureYearWhenCreatedAtIsMissing() {
        Trip trip = Trip.builder()
                .id(42L)
                .departureTime(LocalDateTime.of(2027, 1, 10, 10, 0))
                .build();

        assertThat(generator.generate(trip)).isEqualTo("TRP-2027-000042");
    }

    @Test
    void generate_shouldRejectTripsWithoutId() {
        assertThatThrownBy(() -> generator.generate(Trip.builder().build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Trip id is required");
    }
}
