package com.colick.backoffice.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for forgot password endpoint.
 */
@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
}
