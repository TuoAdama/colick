package com.colick.backoffice.trip.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Request body for creating a new trip.
 */
@Data
public class CreateTripRequest {

    @NotBlank
    private String departureAddress;

    @NotBlank
    private String destination;

    @NotNull
    @Future
    private LocalDateTime departureTime;

    @NotNull
    private LocalDateTime arrivalTime;

    @NotNull
    @DecimalMin("0.1")
    private BigDecimal maxWeight;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal pricePerKilo;

    private boolean instantAcceptance;
}
