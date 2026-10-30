package com.coliclic.backoffice.admin.dto;

import com.coliclic.backoffice.user.entity.User;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public record AdminUserResponse(Long id, String firstName, String lastName, String email,
                                LocalDateTime createdAt, boolean createdAtEstimated,
                                LocalDateTime updatedAt, List<String> connectionMethods, boolean verified) {
    public static AdminUserResponse from(User user) {
        List<String> methods = new ArrayList<>();
        if (user.getGoogleSubject() != null && !user.getGoogleSubject().isBlank()) methods.add("GOOGLE");
        if (!Boolean.FALSE.equals(user.getLocalAuthEnabled())) methods.add("PASSWORD");
        return new AdminUserResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getCreatedAt(), user.isCreatedAtEstimated(), user.getUpdatedAt(), List.copyOf(methods),
                user.getEmailVerifiedAt() != null);
    }
}
