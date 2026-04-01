package com.colick.backoffice.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleNotFound_shouldReturn404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Item not found");

        ResponseEntity<ApiError> response = handler.handleNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertEquals("Item not found", response.getBody().getMessage());
    }

    @Test
    void handleGeneric_shouldReturn500WithGenericMessage() {
        Exception ex = new RuntimeException("something went wrong");

        ResponseEntity<ApiError> response = handler.handleGeneric(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertEquals("An unexpected error occurred", response.getBody().getMessage());
    }

    @Test
    void handleIllegalArgument_shouldReturn400WithMessage() {
        IllegalArgumentException ex = new IllegalArgumentException("Requested weight exceeds available weight");

        ResponseEntity<ApiError> response = handler.handleIllegalArgument(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Requested weight exceeds available weight", response.getBody().getMessage());
    }
}
