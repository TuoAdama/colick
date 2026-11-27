package com.coliclic.backoffice.admin.dto;

import com.coliclic.backoffice.trip.entity.Trip;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminTripResponse(Long id, String reference, String departureAddress, String destination,
                                LocalDateTime departureTime, LocalDateTime arrivalTime, BigDecimal maxWeight,
                                BigDecimal pricePerKilo, Trip.TripStatus status) {
    public static AdminTripResponse from(Trip trip) {
        return new AdminTripResponse(trip.getId(), trip.getReference(), trip.getDepartureAddress(),
                trip.getDestination(), trip.getDepartureTime(), trip.getArrivalTime(), trip.getMaxWeight(),
                trip.getPricePerKilo(), trip.getStatus());
    }
}
