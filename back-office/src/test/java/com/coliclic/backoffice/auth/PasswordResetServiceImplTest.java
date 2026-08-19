package com.coliclic.backoffice.auth;

import com.coliclic.backoffice.auth.passwordreset.entity.PasswordResetToken;
import com.coliclic.backoffice.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.coliclic.backoffice.auth.passwordreset.service.PasswordResetServiceImpl;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.support.TestLocalizedMessages;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @Spy
    private LocalizedMessages localizedMessages = TestLocalizedMessages.create();

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    private User user;

    @BeforeEach
    void setUp() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        ReflectionTestUtils.setField(passwordResetService, "resetBaseUrl", "https://app.coliclic.com/reset-password");
        ReflectionTestUtils.setField(passwordResetService, "expirationMinutes", 45L);

        user = User.builder()
                .id(1L)
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .password("old-hash")
                .identityDocument("ID123")
                .build();
    }

    @Test
    void requestPasswordReset_shouldCreateTokenAndSendEmail_whenEmailExists() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        passwordResetService.requestPasswordReset("john@example.com");

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());

        PasswordResetToken savedToken = tokenCaptor.getValue();
        assertThat(savedToken.getUser()).isEqualTo(user);
        assertThat(savedToken.getTokenHash()).hasSize(64);
        assertThat(savedToken.getExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(40));

        ArgumentCaptor<String> resetUrlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendPasswordResetEmail(
                eq("john@example.com"),
                eq("John"),
                resetUrlCaptor.capture(),
                eq(45L)
        );
        assertThat(resetUrlCaptor.getValue()).startsWith("https://app.coliclic.com/reset-password?token=");
        verify(passwordResetTokenRepository).deleteAllByExpiresAtBefore(any(LocalDateTime.class));
    }

    @Test
    void requestPasswordReset_shouldNotCreateTokenAndShouldStillReturnSilently_whenEmailDoesNotExist() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        passwordResetService.requestPasswordReset("unknown@example.com");

        verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString(), anyLong());
        verify(passwordResetTokenRepository).deleteAllByExpiresAtBefore(any(LocalDateTime.class));
    }

    @Test
    void resetPassword_shouldThrow_whenTokenIsInvalid() {
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passwordResetService.resetPassword("invalid-token", "NewPassword1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid password reset token");
    }

    @Test
    void resetPassword_shouldThrow_whenTokenIsExpired() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(10L)
                .user(user)
                .tokenHash("hash")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("expired-token", "NewPassword1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void resetPassword_shouldThrow_whenTokenAlreadyUsed() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(10L)
                .user(user)
                .tokenHash("hash")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .usedAt(LocalDateTime.now().minusMinutes(1))
                .build();
        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> passwordResetService.resetPassword("used-token", "NewPassword1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already been used");
    }

    @Test
    void resetPassword_shouldUpdateEncodedPasswordAndInvalidateTokens_whenTokenIsValid() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(10L)
                .user(user)
                .tokenHash("hash")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        PasswordResetToken secondActiveToken = PasswordResetToken.builder()
                .id(11L)
                .user(user)
                .tokenHash("hash2")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();

        when(passwordResetTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("StrongPass1")).thenReturn("new-hash");
        when(passwordResetTokenRepository.findAllByUserAndUsedAtIsNull(user))
                .thenReturn(List.of(token, secondActiveToken));

        passwordResetService.resetPassword("valid-token", "StrongPass1");

        assertThat(user.getPassword()).isEqualTo("new-hash");
        assertThat(user.getLocalAuthEnabled()).isTrue();
        verify(userRepository).save(user);
        assertThat(token.getUsedAt()).isNotNull();
        assertThat(secondActiveToken.getUsedAt()).isNotNull();
    }
}
