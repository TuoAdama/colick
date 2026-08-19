package com.coliclic.backoffice.exception;

import com.coliclic.backoffice.support.TestLocalizedMessages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        handler = new GlobalExceptionHandler(TestLocalizedMessages.create());
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

        ResponseEntity<ApiError> response = handler.handleBadRequest(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().getStatus());
        assertEquals("Requested weight exceeds available weight", response.getBody().getMessage());
    }

    @Test
    void handleNoResourceFound_shouldReturn404InsteadOf500() {
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "/uploads/missing.png");

        ResponseEntity<ApiError> response = handler.handleNoResourceFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().getStatus());
        assertTrue(response.getBody().getMessage().contains("/uploads/missing.png"));
    }
}
