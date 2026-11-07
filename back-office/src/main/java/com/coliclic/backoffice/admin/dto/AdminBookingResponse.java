package com.coliclic.backoffice.admin.dto;

import com.coliclic.backoffice.trip.entity.TripBooking;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminBookingResponse(Long id, String title, Long tripId, String tripReference,
                                   String departureAddress, String destination, LocalDateTime createdAt,
                                   BigDecimal weight, TripBooking.BookingStatus status) {
    public static AdminBookingResponse from(TripBooking booking) {
        var trip = booking.getTrip();
        return new AdminBookingResponse(booking.getId(), booking.getTitle(), trip.getId(), trip.getReference(),
                trip.getDepartureAddress(), trip.getDestination(), booking.getCreatedAt(), booking.getWeight(),
                booking.getStatus());
    }
}
