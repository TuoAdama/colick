package com.colick.backoffice.trip.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request body for submitting a booking request on a trip.
 */
@Data
public class CreateBookingRequest {

    @DecimalMin(value = "0.1", message = "Weight must be greater than 0")
    private BigDecimal weight;

    private String description;

    private String packagePhotoUrl;
}
