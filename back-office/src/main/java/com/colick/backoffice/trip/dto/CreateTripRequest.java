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

    @NotBlank(message = "Departure address is required")
    private String departureAddress;

    @NotBlank(message = "Destination is required")
    private String destination;

    @NotNull(message = "Departure time is required")
    @Future(message = "Departure time must be in the future")
    private LocalDateTime departureTime;

    @NotNull(message = "Arrival time is required")
    private LocalDateTime arrivalTime;

    @NotNull(message = "Max weight is required")
    @DecimalMin(value = "0.1", message = "Max weight must be greater than 0")
    private BigDecimal maxWeight;

    @NotNull(message = "Price per kilo is required")
    @DecimalMin(value = "0.01", message = "Price per kilo must be greater than 0")
    private BigDecimal pricePerKilo;

    private boolean instantAcceptance;
}
