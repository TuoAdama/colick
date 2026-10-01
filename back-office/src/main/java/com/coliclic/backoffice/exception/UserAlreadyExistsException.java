package com.coliclic.backoffice.exception;

/**
 * Thrown when attempting to create a user with an already registered email.
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
