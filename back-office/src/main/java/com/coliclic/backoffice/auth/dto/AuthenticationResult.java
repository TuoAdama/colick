package com.coliclic.backoffice.auth.dto;

import com.coliclic.backoffice.user.dto.UserResponse;

/** Internal authentication result used to issue the HTTP-only session cookie. */
public record AuthenticationResult(String token, UserResponse user) {
}
