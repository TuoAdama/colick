package com.coliclic.backoffice.parcelrequest.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateParcelRequestRequest {

    @NotBlank
    private String departure;

    @NotBlank
    private String destination;

    private LocalDate desiredDate;

    @NotBlank
    private String packageTitle;

    @NotNull
    @DecimalMin(value = "0.1")
    private BigDecimal weight;

    private String description;

    private String packagePhotoUrl;
}
