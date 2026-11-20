package com.coliclic.backoffice.exception;

import com.coliclic.backoffice.trip.entity.TripBooking;

public class ValidationCodeDeliveryException extends RuntimeException {

    private final TripBooking.ValidationDeliveryChannel deliveryChannel;

    public ValidationCodeDeliveryException(String message,
                                           TripBooking.ValidationDeliveryChannel deliveryChannel,
                                           Throwable cause) {
        super(message, cause);
        this.deliveryChannel = deliveryChannel;
    }

    public TripBooking.ValidationDeliveryChannel getDeliveryChannel() {
        return deliveryChannel;
    }
}
