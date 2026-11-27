package com.coliclic.backoffice.trip.service;

import com.coliclic.backoffice.trip.entity.Trip;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class TripReferenceGenerator {

    private final JdbcTemplate jdbcTemplate;

    public String generateForNewTrip(Trip trip) {
        if (trip == null) {
            throw new IllegalArgumentException("Trip is required to generate a reference");
        }

        Long referenceNumber = jdbcTemplate.queryForObject(
                "SELECT nextval('trip_reference_seq')",
                Long.class
        );
        if (referenceNumber == null) {
            throw new IllegalStateException("Trip reference sequence did not return a value");
        }

        int year = resolveReferenceDate(trip).getYear();
        return "TRP-%d-%06d".formatted(year, referenceNumber);
    }

    public String generate(Trip trip) {
        if (trip == null || trip.getId() == null) {
            throw new IllegalArgumentException("Trip id is required to generate a reference");
        }

        int year = resolveReferenceDate(trip).getYear();
        return "TRP-%d-%06d".formatted(year, trip.getId());
    }

    private LocalDateTime resolveReferenceDate(Trip trip) {
        if (trip.getCreatedAt() != null) {
            return trip.getCreatedAt();
        }
        if (trip.getDepartureTime() != null) {
            return trip.getDepartureTime();
        }
        return LocalDateTime.now();
    }
}
