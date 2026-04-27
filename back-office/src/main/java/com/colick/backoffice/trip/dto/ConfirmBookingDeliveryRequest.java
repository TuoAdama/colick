package com.colick.backoffice.trip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConfirmBookingDeliveryRequest {

    @NotBlank(message = "Validation code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Validation code must contain exactly 6 digits")
    private String validationCode;
}
