package com.coliclic.backoffice.dispute;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisputeRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = DESCRIPTION_MAX_LENGTH) String description,
        @Size(max = REFERENCE_MAX_LENGTH) String tripReference,
        @Size(max = REFERENCE_MAX_LENGTH) String bookingReference
) {
    static final int DESCRIPTION_MAX_LENGTH = 4700;
    static final int REFERENCE_MAX_LENGTH = 100;
}
