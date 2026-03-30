package com.colick.backoffice.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for updating an existing user's information.
 */
@Data
public class UpdateUserRequest {

    private String firstName;

    private String lastName;

    @Email(message = "Email must be valid")
    private String email;

    private String phone;

    private String identityDocument;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
