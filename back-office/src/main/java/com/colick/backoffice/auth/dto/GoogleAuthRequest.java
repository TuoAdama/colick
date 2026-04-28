package com.colick.backoffice.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body carrying the Google ID token obtained in the front-end.
 */
@Data
public class GoogleAuthRequest {

    @NotBlank(message = "Google ID token is required")
    private String idToken;
}
