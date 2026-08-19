package com.coliclic.backoffice.exception;

/**
 * Raised when a final traveler review already exists for the targeted booking.
 */
public class ReviewSubmissionConflictException extends RuntimeException {

    public ReviewSubmissionConflictException(String message) {
        super(message);
    }
}
