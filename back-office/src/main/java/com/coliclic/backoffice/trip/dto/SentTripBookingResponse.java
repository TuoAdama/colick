package com.coliclic.backoffice.trip.dto;

import com.coliclic.backoffice.trip.entity.TripBooking;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Booking view used by the sender's booking list.
 * It supplements the regular booking response with the minimum trip data
 * needed to render the sent-booking card without additional requests.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class SentTripBookingResponse extends TripBookingResponse {

    private String tripDestination;
    private Long travelerId;

    public static SentTripBookingResponse from(TripBooking booking,
                                               Double senderRatingAverage,
                                               Long senderRatingCount) {
        TripBookingResponse base = TripBookingResponse.from(booking, senderRatingAverage, senderRatingCount);
        SentTripBookingResponse response = new SentTripBookingResponse();

        response.setId(base.getId());
        response.setTripId(base.getTripId());
        response.setSenderId(base.getSenderId());
        response.setSenderName(base.getSenderName());
        response.setSenderPhotoUrl(base.getSenderPhotoUrl());
        response.setSenderRatingAverage(base.getSenderRatingAverage());
        response.setSenderRatingCount(base.getSenderRatingCount());
        response.setTitle(base.getTitle());
        response.setWeight(base.getWeight());
        response.setDescription(base.getDescription());
        response.setPackagePhotoUrl(base.getPackagePhotoUrl());
        response.setRecipientContact(base.getRecipientContact());
        response.setStatus(base.getStatus());
        response.setValidationDeliveryChannel(base.getValidationDeliveryChannel());
        response.setValidationDeliveryStatus(base.getValidationDeliveryStatus());
        response.setValidationCodeSentAt(base.getValidationCodeSentAt());
        response.setValidationCodeInvalidatedAt(base.getValidationCodeInvalidatedAt());
        response.setValidationCodeDeliveryFailedAt(base.getValidationCodeDeliveryFailedAt());
        response.setDeliveredAt(base.getDeliveredAt());
        response.setCreatedAt(base.getCreatedAt());
        response.setValidationCodeActive(base.isValidationCodeActive());
        response.setTripDestination(booking.getTrip().getDestination());
        response.setTravelerId(booking.getTrip().getTraveler().getId());
        return response;
    }
}
