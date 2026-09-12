package com.coliclic.backoffice.auth.google;

/**
 * Minimal Google token payload needed by Coliclic.
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
