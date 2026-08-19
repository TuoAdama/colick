package com.coliclic.backoffice.user.dto;

import com.coliclic.backoffice.user.entity.User;
import lombok.Builder;
import lombok.Data;

/**
 * Read-only view of a user returned by the API (no password exposed).
 */
@Data
@Builder
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String identityDocument;
    private String photoUrl;
    private User.Role role;
    private Boolean hasPassword;

    /**
     * Maps a {@link User} entity to a {@link UserResponse} DTO.
     */
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .identityDocument(normalizeBlank(user.getIdentityDocument()))
                .photoUrl(user.getPhotoUrl())
                .role(user.getRole())
                .hasPassword(!Boolean.FALSE.equals(user.getLocalAuthEnabled()))
                .build();
    }

    private static String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }
}
