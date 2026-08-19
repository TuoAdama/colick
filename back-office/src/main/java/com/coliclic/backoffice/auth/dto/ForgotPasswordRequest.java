package com.coliclic.backoffice.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for forgot password endpoint.
 */
@Data
public class ForgotPasswordRequest {

    @NotBlank
    @Email
    private String email;
}
