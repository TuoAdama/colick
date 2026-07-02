package com.colick.backoffice.trip;

import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.service.TripReferenceGenerator;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TripReferenceGeneratorTest {

    private final TripReferenceGenerator generator = new TripReferenceGenerator();

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
