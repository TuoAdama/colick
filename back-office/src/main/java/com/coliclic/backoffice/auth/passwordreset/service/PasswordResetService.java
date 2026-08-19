package com.coliclic.backoffice.auth.passwordreset.service;

/**
 * Handles forgot password and reset password flows.
 */
public interface PasswordResetService {

    void requestPasswordReset(String email);

    void resetPassword(String rawToken, String newPassword);
}
