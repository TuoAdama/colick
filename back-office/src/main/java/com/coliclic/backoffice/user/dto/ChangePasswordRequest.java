package com.coliclic.backoffice.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for changing the authenticated user's password.
 * Requires the current password for verification.
 */
@Data
public class ChangePasswordRequest {

    /** The user's current (old) password — used for identity verification. */
    @NotBlank
    private String oldPassword;

    /** The desired new password — must be at least 8 characters. */
    @NotBlank
    @Size(min = 8)
    private String newPassword;
}
