package com.coliclic.backoffice.auth.passwordreset.service;

import java.util.Locale;

/**
 * Handles forgot password and reset password flows.
 */
public interface PasswordResetService {

    void requestPasswordReset(String email, Locale locale);

    void resetPassword(String rawToken, String newPassword);
}
