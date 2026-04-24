package com.colick.backoffice.auth.controller;

import com.colick.backoffice.auth.dto.AuthResponse;
import com.colick.backoffice.auth.dto.ForgotPasswordRequest;
import com.colick.backoffice.auth.dto.GenericMessageResponse;
import com.colick.backoffice.auth.dto.LoginRequest;
import com.colick.backoffice.auth.dto.ResetPasswordRequest;
import com.colick.backoffice.auth.passwordreset.service.PasswordResetService;
import com.colick.backoffice.auth.util.JwtUtil;
import com.colick.backoffice.exception.ResourceNotFoundException;
import com.colick.backoffice.user.dto.UserResponse;
import com.colick.backoffice.user.entity.User;
import com.colick.backoffice.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authentication endpoints.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetService passwordResetService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          PasswordResetService passwordResetService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.passwordResetService = passwordResetService;
    }

    /** Authenticates a user and returns a JWT token. */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password"));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new AccessDeniedException(
                    "Votre compte n'est pas encore activé. Vérifiez votre email. / Your account is not activated yet. Please check your email."
            );
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = jwtUtil.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(UserResponse.from(user))
                .build());
    }

    /**
     * Initiates a forgot password request and always returns a generic response.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<GenericMessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.getEmail());
        return ResponseEntity.accepted().body(
                new GenericMessageResponse(
                        "If an account exists for this email, a password reset link has been sent"
                )
        );
    }

    /**
     * Resets the password using a valid one-time reset token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<GenericMessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new GenericMessageResponse("Password reset successful"));
    }
}
