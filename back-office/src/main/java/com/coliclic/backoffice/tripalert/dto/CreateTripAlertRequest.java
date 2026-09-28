package com.coliclic.backoffice.tripalert.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.AssertTrue;
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

    private LocalDate dateEnd;

    @AssertTrue(message = "La date de fin doit être postérieure ou égale à la date de début.")
    public boolean isDateRangeValid() {
        return date == null || dateEnd == null || !dateEnd.isBefore(date);
    }

    private String sort;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal minPrice;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal maxPrice;
}
