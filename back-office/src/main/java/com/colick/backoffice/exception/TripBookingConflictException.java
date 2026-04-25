package com.colick.backoffice.exception;

/**
 * Thrown when a sender tries to create more than one active booking for the same trip.
 */
public class TripBookingConflictException extends RuntimeException {

    public TripBookingConflictException(String message) {
        super(message);
    }
}