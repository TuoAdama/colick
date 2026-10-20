package com.coliclic.backoffice.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import jakarta.validation.constraints.AssertTrue;

@Data
public class ContactRequest {

    public enum Category { GENERAL, PROFILE_REPORT }

    @NotBlank
    @Email
    @Size(max = 254)
    private String email;

    @NotBlank
    @Size(max = 150)
    private String subject;

    @NotBlank
    @Size(max = 5000)
    private String message;

    private Category category = Category.GENERAL;

    private Long travelerId;

    private Long tripId;

    @AssertTrue(message = "Un profil doit être indiqué pour un signalement.")
    public boolean isContextValid() {
        return category != Category.PROFILE_REPORT || travelerId != null;
    }
}
