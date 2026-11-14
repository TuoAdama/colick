package com.coliclic.backoffice.user.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

/**
 * Request body for updating an existing user's information.
 */
@Data
public class UpdateUserRequest {

    private String firstName;

    private String lastName;

    @Email
    private String email;

    private String phone;

}
