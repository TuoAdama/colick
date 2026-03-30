package com.colick.backoffice.trip.dto;

import com.colick.backoffice.trip.entity.Trip;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Read-only view of a trip returned by the API.
 */
@Data
@Builder
public class TripResponse {

    private Long id;
    private Long travelerId;
    private String travelerName;
    private String departureAddress;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private BigDecimal maxWeight;
    private BigDecimal pricePerKilo;
    private boolean instantAcceptance;
    private Trip.TripStatus status;

    /**
     * Maps a {@link Trip} entity to a {@link TripResponse} DTO.
     */
    public static TripResponse from(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .travelerId(trip.getTraveler().getId())
                .travelerName(trip.getTraveler().getFirstName() + " " + trip.getTraveler().getLastName())
                .departureAddress(trip.getDepartureAddress())
                .destination(trip.getDestination())
                .departureTime(trip.getDepartureTime())
                .arrivalTime(trip.getArrivalTime())
                .maxWeight(trip.getMaxWeight())
                .pricePerKilo(trip.getPricePerKilo())
                .instantAcceptance(trip.isInstantAcceptance())
                .status(trip.getStatus())
                .build();
    }
}
