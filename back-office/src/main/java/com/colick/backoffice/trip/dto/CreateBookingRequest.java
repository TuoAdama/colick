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

    @NotBlank(message = "Package title is required")
    private String title;

    @NotNull(message = "Package weight is required")
    @DecimalMin(value = "0.1", message = "Weight must be greater than 0")
    private BigDecimal weight;

    private String description;

    private String packagePhotoUrl;

    @NotBlank(message = "Recipient contact is required")
    private String recipientContact;
}
