package com.colick.backoffice.trip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConfirmBookingDeliveryRequest {

    @NotBlank
    @Pattern(regexp = "^\\d{6}$", message = "{validation.validationCode.pattern}")
    private String validationCode;
}
