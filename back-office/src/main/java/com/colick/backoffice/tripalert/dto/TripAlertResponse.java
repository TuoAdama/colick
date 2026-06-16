package com.colick.backoffice.tripalert.dto;

import com.colick.backoffice.tripalert.entity.TripAlert;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TripAlertResponse {

    private Long id;
    private String departure;
    private String destination;
    private LocalDate date;
    private String sort;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private LocalDateTime createdAt;
    private boolean alreadyExists;

    public static TripAlertResponse from(TripAlert alert) {
        return from(alert, false);
    }

    public static TripAlertResponse alreadyExisting(TripAlert alert) {
        return from(alert, true);
    }

    private static TripAlertResponse from(TripAlert alert, boolean alreadyExists) {
        return TripAlertResponse.builder()
                .id(alert.getId())
                .departure(alert.getDeparture())
                .destination(alert.getDestination())
                .date(alert.getDate())
                .sort(alert.getSort())
                .minPrice(alert.getMinPrice())
                .maxPrice(alert.getMaxPrice())
                .createdAt(alert.getCreatedAt())
                .alreadyExists(alreadyExists)
                .build();
    }
}
