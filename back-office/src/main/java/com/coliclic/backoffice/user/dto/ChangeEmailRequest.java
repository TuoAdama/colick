package com.coliclic.backoffice.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for initiating an e-mail address change.
 * A confirmation link will be sent to the provided address.
 */
@Data
public class ChangeEmailRequest {

    /** The new e-mail address to associate with the account after confirmation. */
    @NotBlank
    @Email
    private String newEmail;
}
