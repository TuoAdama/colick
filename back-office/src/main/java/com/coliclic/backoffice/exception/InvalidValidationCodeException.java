package com.coliclic.backoffice.exception;

/** A failed delivery-code attempt whose counter must survive transaction completion. */
public class InvalidValidationCodeException extends BadRequestException {
    public InvalidValidationCodeException(String message) {
        super(message);
    }
}
