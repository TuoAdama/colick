package com.coliclic.backoffice.trip.dto;

import com.coliclic.backoffice.trip.entity.TripBooking;
import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Read-only view of a trip booking returned by the API.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripBookingResponse {

    private Long id;
    private Long tripId;
    private Long senderId;
    private String senderName;
    private String senderPhotoUrl;
    private Double senderRatingAverage;
    private Long senderRatingCount;
    private String title;
    private BigDecimal weight;
    private String description;
    private String packagePhotoUrl;
    private String recipientContact;
    private TripBooking.BookingStatus status;
    private TripBooking.ValidationDeliveryChannel validationDeliveryChannel;
    private TripBooking.ValidationDeliveryStatus validationDeliveryStatus;
    private LocalDateTime validationCodeSentAt;
    private LocalDateTime validationCodeInvalidatedAt;
    private LocalDateTime validationCodeDeliveryFailedAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime createdAt;
    private boolean validationCodeActive;

    /**
     * Maps a {@link TripBooking} entity to a {@link TripBookingResponse} DTO.
     */
    public static TripBookingResponse from(TripBooking booking,
                                           Double senderRatingAverage,
                                           Long senderRatingCount) {
        return TripBookingResponse.builder()
                .id(booking.getId())
                .tripId(booking.getTrip().getId())
                .senderId(booking.getSender().getId())
                .senderName(booking.getSender().getFirstName() + " " + booking.getSender().getLastName())
                .senderPhotoUrl(booking.getSender().getPhotoUrl())
                .senderRatingAverage(senderRatingAverage)
                .senderRatingCount(senderRatingCount)
                .title(booking.getTitle())
                .weight(booking.getWeight())
                .description(booking.getDescription())
                .packagePhotoUrl(booking.getPackagePhotoUrl())
                .recipientContact(booking.getRecipientContact())
                .status(booking.getStatus())
                .validationDeliveryChannel(booking.getValidationDeliveryChannel())
                .validationDeliveryStatus(booking.getValidationDeliveryStatus())
                .validationCodeSentAt(booking.getValidationCodeSentAt())
                .validationCodeInvalidatedAt(booking.getValidationCodeInvalidatedAt())
                .validationCodeDeliveryFailedAt(booking.getValidationCodeDeliveryFailedAt())
                .deliveredAt(booking.getDeliveredAt())
                .createdAt(booking.getCreatedAt())
                .validationCodeActive(booking.hasActiveValidationCode())
                .build();
    }
}
