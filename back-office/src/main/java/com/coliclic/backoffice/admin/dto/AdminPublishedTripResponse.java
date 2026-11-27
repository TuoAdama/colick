package com.coliclic.backoffice.admin.dto;

import com.coliclic.backoffice.trip.entity.Trip;
import java.time.LocalDateTime;

public record AdminPublishedTripResponse(AdminTripResponse trip, Long travelerId, String travelerName,
                                         LocalDateTime createdAt) {
    public static AdminPublishedTripResponse from(Trip trip) {
        var traveler = trip.getTraveler();
        return new AdminPublishedTripResponse(AdminTripResponse.from(trip), traveler.getId(),
                traveler.getFirstName() + " " + traveler.getLastName(), trip.getCreatedAt());
    }
}
