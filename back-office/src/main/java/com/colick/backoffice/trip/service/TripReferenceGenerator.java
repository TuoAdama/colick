package com.colick.backoffice.trip.service;

import com.colick.backoffice.trip.entity.Trip;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class TripReferenceGenerator {

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
