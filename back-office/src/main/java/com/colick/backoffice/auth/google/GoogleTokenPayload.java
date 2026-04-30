package com.colick.backoffice.auth.google;

/**
 * Minimal Google token payload needed by Colick.
 */
public record GoogleTokenPayload(
        String subject,
        String email,
        String firstName,
        String lastName,
        String fullName,
        boolean emailVerified
) {
}
