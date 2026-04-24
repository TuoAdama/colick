package com.colick.backoffice.auth;

import com.colick.backoffice.auth.passwordreset.entity.PasswordResetToken;
import com.colick.backoffice.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.colick.backoffice.user.entity.User;
import com.colick.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = "spring.sql.init.mode=never")
class PasswordResetTokenRepositoryTest {

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByTokenHash_shouldReturnToken() {
        User user = User.builder()
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .identityDocument("ID123")
                .password("hashed")
                .enabled(true)
                .role(User.Role.USER)
                .build();
        User savedUser = userRepository.save(user);

        PasswordResetToken token = PasswordResetToken.builder()
                .user(savedUser)
                .tokenHash("abc123")
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();
        passwordResetTokenRepository.save(token);

        var found = passwordResetTokenRepository.findByTokenHash("abc123");

        assertThat(found).isPresent();
        assertThat(found.get().getUser().getId()).isEqualTo(savedUser.getId());
    }
}
