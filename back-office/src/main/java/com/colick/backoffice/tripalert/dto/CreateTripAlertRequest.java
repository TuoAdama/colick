package com.colick.backoffice.tripalert.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateTripAlertRequest {

    @NotBlank
    private String departure;

    @NotBlank
    private String destination;

    private LocalDate date;

    private String sort;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal minPrice;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal maxPrice;
}
