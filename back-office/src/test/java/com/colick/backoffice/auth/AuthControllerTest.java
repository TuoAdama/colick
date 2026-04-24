package com.colick.backoffice.auth;

import com.colick.backoffice.auth.controller.AuthController;
import com.colick.backoffice.auth.dto.ForgotPasswordRequest;
import com.colick.backoffice.auth.dto.LoginRequest;
import com.colick.backoffice.auth.dto.ResetPasswordRequest;
import com.colick.backoffice.auth.passwordreset.service.PasswordResetService;
import com.colick.backoffice.auth.util.JwtUtil;
import com.colick.backoffice.user.entity.User;
import com.colick.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordResetService passwordResetService;

    @InjectMocks
    private AuthController authController;

    @Test
    void login_shouldThrowAccessDenied_whenAccountIsNotEnabled() {
        User user = User.builder()
                .id(1L)
                .email("john@example.com")
                .password("hashed")
                .enabled(false)
                .build();
        LoginRequest request = new LoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("password");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authController.login(request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not activated");
    }

    @Test
    void login_shouldReturnUnauthorized_whenPasswordDoesNotMatch() {
        User user = User.builder()
                .id(1L)
                .email("john@example.com")
                .password("hashed")
                .enabled(true)
                .build();
        LoginRequest request = new LoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("wrong");

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThat(authController.login(request).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void forgotPassword_shouldAlwaysReturnAcceptedGenericResponse() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("john@example.com");

        doNothing().when(passwordResetService).requestPasswordReset(anyString());

        var response = authController.forgotPassword(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("If an account exists");
        verify(passwordResetService).requestPasswordReset("john@example.com");
    }

    @Test
    void resetPassword_shouldReturnOkWhenSuccessful() {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("NewPassword1");

        doNothing().when(passwordResetService).resetPassword("valid-token", "NewPassword1");

        var response = authController.resetPassword(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).contains("successful");
        verify(passwordResetService).resetPassword("valid-token", "NewPassword1");
    }
}
