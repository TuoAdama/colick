package com.colick.backoffice.trip.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Request body for updating an existing trip.
 * All fields are optional — only non-null values are applied.
 */
@Data
public class UpdateTripRequest {

    private String departureAddress;

    private String destination;

    private LocalDateTime departureTime;

    private LocalDateTime arrivalTime;

    @DecimalMin("0.1")
    private BigDecimal maxWeight;

    @DecimalMin("0.01")
    private BigDecimal pricePerKilo;

    private Boolean instantAcceptance;
}
