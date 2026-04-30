package com.colick.backoffice.exception;

/**
 * Thrown when a trip cannot be updated because of its current status.
 */
public class TripUpdateNotAllowedException extends RuntimeException {

    public TripUpdateNotAllowedException(String message) {
        super(message);
    }
}
