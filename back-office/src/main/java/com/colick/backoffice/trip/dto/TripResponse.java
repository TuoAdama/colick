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
    private String travelerPhotoUrl;
    private String departureAddress;
    private String destination;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private BigDecimal maxWeight;
    private BigDecimal pricePerKilo;
    private boolean instantAcceptance;
    private Trip.TripStatus status;
    private LocalDateTime createdAt;
    private Double travelerRatingAverage;
    private Long travelerRatingCount;

    /** Available weight (maxWeight minus sum of accepted bookings). May be null when not computed. */
    private BigDecimal availableWeight;

    /**
     * Maps a {@link Trip} entity to a {@link TripResponse} DTO.
     * {@code availableWeight} will be {@code null} (omitted from JSON by Jackson non_null policy).
     */
    public static TripResponse from(Trip trip) {
        return from(trip, null, null, 0L);
    }

    /**
     * Maps a {@link Trip} entity to a {@link TripResponse} DTO, including the computed available weight.
     *
     * @param trip            the trip entity
     * @param availableWeight pre-computed available weight (may be {@code null})
     */
    public static TripResponse from(Trip trip, BigDecimal availableWeight) {
        return from(trip, availableWeight, null, 0L);
    }

    /**
     * Maps a {@link Trip} entity to a {@link TripResponse} DTO with available weight and traveler rating data.
     *
     * @param trip                  the trip entity
     * @param availableWeight       pre-computed available weight (may be {@code null})
     * @param travelerRatingAverage average traveler rating (may be {@code null})
     * @param travelerRatingCount   number of submitted traveler reviews
     */
    public static TripResponse from(Trip trip,
                                    BigDecimal availableWeight,
                                    Double travelerRatingAverage,
                                    Long travelerRatingCount) {
        return TripResponse.builder()
                .id(trip.getId())
                .travelerId(trip.getTraveler().getId())
                .travelerName(trip.getTraveler().getFirstName() + " " + trip.getTraveler().getLastName())
                .travelerPhotoUrl(trip.getTraveler().getPhotoUrl())
                .departureAddress(trip.getDepartureAddress())
                .destination(trip.getDestination())
                .departureTime(trip.getDepartureTime())
                .arrivalTime(trip.getArrivalTime())
                .maxWeight(trip.getMaxWeight())
                .pricePerKilo(trip.getPricePerKilo())
                .instantAcceptance(trip.isInstantAcceptance())
                .status(trip.getStatus())
                .createdAt(trip.getCreatedAt())
                .travelerRatingAverage(travelerRatingAverage)
                .travelerRatingCount(travelerRatingCount)
                .availableWeight(availableWeight)
                .build();
    }
}
