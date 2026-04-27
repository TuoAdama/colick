package com.colick.backoffice.exception;

import com.colick.backoffice.trip.entity.TripBooking;

public class ValidationCodeDeliveryException extends RuntimeException {

    private final String recipientContact;
    private final TripBooking.ValidationDeliveryChannel deliveryChannel;

    public ValidationCodeDeliveryException(String message,
                                           String recipientContact,
                                           TripBooking.ValidationDeliveryChannel deliveryChannel,
                                           Throwable cause) {
        super(message, cause);
        this.recipientContact = recipientContact;
        this.deliveryChannel = deliveryChannel;
    }

    public String getRecipientContact() {
        return recipientContact;
    }

    public TripBooking.ValidationDeliveryChannel getDeliveryChannel() {
        return deliveryChannel;
    }
}
