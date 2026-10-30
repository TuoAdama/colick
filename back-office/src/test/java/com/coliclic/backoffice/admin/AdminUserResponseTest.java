package com.coliclic.backoffice.admin;

import com.coliclic.backoffice.admin.dto.AdminUserResponse;
import com.coliclic.backoffice.user.entity.User;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.assertThat;

class AdminUserResponseTest {
    @Test
    void reflectsAvailableMethodsAndLegacyPasswordDefault() {
        User user = User.builder().localAuthEnabled(null).authProvider(null).build();
        assertThat(AdminUserResponse.from(user).connectionMethods()).containsExactly("PASSWORD");
        user.setGoogleSubject("google-subject");
        assertThat(AdminUserResponse.from(user).connectionMethods()).containsExactly("GOOGLE", "PASSWORD");
        user.setLocalAuthEnabled(false);
        assertThat(AdminUserResponse.from(user).connectionMethods()).containsExactly("GOOGLE");
    }

    @Test
    void verificationDependsOnEmailVerificationNotAccountActivation() {
        User user = User.builder().enabled(true).build();
        assertThat(AdminUserResponse.from(user).verified()).isFalse();
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setEnabled(false);
        assertThat(AdminUserResponse.from(user).verified()).isTrue();
    }
}
