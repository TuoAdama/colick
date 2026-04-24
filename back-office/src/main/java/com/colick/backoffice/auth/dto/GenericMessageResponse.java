package com.colick.backoffice.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Generic API response carrying a user-facing message.
 */
@Getter
@AllArgsConstructor
public class GenericMessageResponse {

    private String message;
}
