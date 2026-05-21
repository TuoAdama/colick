package com.colick.backoffice.trip.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request body for submitting a booking request on a trip.
 */
@Data
public class CreateBookingRequest {

    @NotBlank
    private String title;

    @NotNull
    @DecimalMin("0.1")
    private BigDecimal weight;

    private String description;

    private String packagePhotoUrl;

    @NotBlank
    private String recipientContact;
}
