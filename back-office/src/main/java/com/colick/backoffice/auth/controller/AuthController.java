package com.colick.backoffice.auth.controller;

import com.colick.backoffice.auth.dto.AuthResponse;
import com.colick.backoffice.auth.dto.ForgotPasswordRequest;
import com.colick.backoffice.auth.dto.GenericMessageResponse;
import com.colick.backoffice.auth.dto.GoogleAuthConfigResponse;
import com.colick.backoffice.auth.dto.GoogleAuthRequest;
import com.colick.backoffice.auth.dto.LoginRequest;
import com.colick.backoffice.auth.dto.ResetPasswordRequest;
import com.colick.backoffice.auth.google.GoogleAuthenticationService;
import com.colick.backoffice.auth.passwordreset.service.PasswordResetService;
import com.colick.backoffice.auth.util.JwtUtil;
import com.colick.backoffice.exception.UnauthorizedException;
import com.colick.backoffice.i18n.LocalizedMessages;
import com.colick.backoffice.user.dto.UserResponse;
import com.colick.backoffice.user.entity.User;
import com.colick.backoffice.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
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
    private final GoogleAuthenticationService googleAuthenticationService;
    private final LocalizedMessages localizedMessages;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          PasswordResetService passwordResetService,
                          GoogleAuthenticationService googleAuthenticationService,
                          LocalizedMessages localizedMessages) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.passwordResetService = passwordResetService;
        this.googleAuthenticationService = googleAuthenticationService;
        this.localizedMessages = localizedMessages;
    }

    /** Authenticates a user and returns a JWT token. */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException(localizedMessages.get("error.auth.invalidCredentials")));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new AccessDeniedException(localizedMessages.get("error.auth.accountNotActivated"));
        }

        if (Boolean.FALSE.equals(user.getLocalAuthEnabled())) {
            throw new AccessDeniedException(localizedMessages.get("error.auth.googleLoginRequired"));
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException(localizedMessages.get("error.auth.invalidCredentials"));
        }

        String token = jwtUtil.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(UserResponse.from(user))
                .build());
    }

    /** Returns the public Google auth configuration needed by the front-end. */
    @GetMapping("/google/config")
    public ResponseEntity<GoogleAuthConfigResponse> getGoogleConfig() {
        return ResponseEntity.ok(googleAuthenticationService.getConfiguration());
    }

    /** Authenticates a user with a Google ID token and returns a Colick JWT. */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> authenticateWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(googleAuthenticationService.authenticate(request.getIdToken()));
    }

    /**
     * Initiates a forgot password request and always returns a generic response.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<GenericMessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.getEmail());
        return ResponseEntity.accepted().body(
                new GenericMessageResponse(
                        localizedMessages.get("api.auth.forgotPassword.accepted")
                )
        );
    }

    /**
     * Resets the password using a valid one-time reset token.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<GenericMessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new GenericMessageResponse(localizedMessages.get("api.auth.resetPassword.success")));
    }
}
