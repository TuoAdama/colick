package com.coliclic.backoffice.admin.dto;

import com.coliclic.backoffice.trip.entity.TripBooking;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminTripBookingResponse(Long id, String title, Long senderId, String senderName, BigDecimal weight,
                                        TripBooking.BookingStatus status, LocalDateTime createdAt) {
    public static AdminTripBookingResponse from(TripBooking booking) {
        var sender = booking.getSender();
        return new AdminTripBookingResponse(booking.getId(), booking.getTitle(), sender.getId(),
                sender.getFirstName() + " " + sender.getLastName(), booking.getWeight(), booking.getStatus(),
                booking.getCreatedAt());
    }
}
