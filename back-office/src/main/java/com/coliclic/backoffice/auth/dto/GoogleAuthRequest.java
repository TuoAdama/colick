package com.coliclic.backoffice.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body carrying the Google ID token obtained in the front-end.
 */
@Data
public class GoogleAuthRequest {

    @NotBlank
    private String idToken;
}
