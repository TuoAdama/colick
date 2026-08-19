package com.coliclic.backoffice.auth.dto;

import com.coliclic.backoffice.user.dto.UserResponse;
import lombok.Builder;
import lombok.Data;

/**
 * Response returned after a successful authentication.
 */
@Data
@Builder
public class AuthResponse {

    private String token;
    private String type;
    private UserResponse user;
}
