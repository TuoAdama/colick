package com.coliclic.backoffice.auth.controller;

import com.coliclic.backoffice.auth.cookie.AuthCookieService;
import com.coliclic.backoffice.auth.dto.AuthenticationResult;
import com.coliclic.backoffice.auth.dto.AuthResponse;
import com.coliclic.backoffice.auth.dto.ForgotPasswordRequest;
import com.coliclic.backoffice.auth.dto.GenericMessageResponse;
import com.coliclic.backoffice.auth.dto.GoogleAuthConfigResponse;
import com.coliclic.backoffice.auth.dto.GoogleAuthRequest;
import com.coliclic.backoffice.auth.dto.LoginRequest;
import com.coliclic.backoffice.auth.dto.ResetPasswordRequest;
import com.coliclic.backoffice.auth.google.GoogleAuthenticationService;
import com.coliclic.backoffice.auth.passwordreset.service.PasswordResetService;
import com.coliclic.backoffice.auth.ratelimit.AuthRateLimiter;
import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.exception.TooManyRequestsException;
import com.coliclic.backoffice.exception.UnauthorizedException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.user.dto.UserResponse;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

/**
 * REST controller for authentication endpoints.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String DUMMY_PASSWORD_HASH =
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetService passwordResetService;
    private final GoogleAuthenticationService googleAuthenticationService;
    private final LocalizedMessages localizedMessages;
    private final AuthCookieService authCookieService;
    private final CsrfTokenRepository csrfTokenRepository;
    private final AuthRateLimiter authRateLimiter;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          PasswordResetService passwordResetService,
                          GoogleAuthenticationService googleAuthenticationService,
                          LocalizedMessages localizedMessages,
                          AuthCookieService authCookieService,
                          CsrfTokenRepository csrfTokenRepository,
                          AuthRateLimiter authRateLimiter) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.passwordResetService = passwordResetService;
        this.googleAuthenticationService = googleAuthenticationService;
        this.localizedMessages = localizedMessages;
        this.authCookieService = authCookieService;
        this.csrfTokenRepository = csrfTokenRepository;
        this.authRateLimiter = authRateLimiter;
    }

    /** Authenticates a user and stores the JWT in an HTTP-only cookie. */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest servletRequest,
                                              HttpServletResponse response) {
        enforceRateLimit(authRateLimiter.checkLogin(request.getEmail(), servletRequest.getRemoteAddr()));

        Optional<User> candidate = userRepository.findByEmail(request.getEmail());
        String passwordHash = candidate.map(User::getPassword)
                .filter(value -> !value.isBlank())
                .orElse(DUMMY_PASSWORD_HASH);
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), passwordHash);
        User user = candidate.orElse(null);
        boolean loginAllowed = user != null
                && !Boolean.FALSE.equals(user.getEnabled())
                && !Boolean.FALSE.equals(user.getLocalAuthEnabled())
                && passwordMatches;

        if (!loginAllowed) {
            throw new UnauthorizedException(localizedMessages.get("error.auth.invalidCredentials"));
        }

        String token = jwtUtil.generateToken(user);
        response.addHeader(HttpHeaders.SET_COOKIE, authCookieService.create(token).toString());
        return ResponseEntity.ok(AuthResponse.builder()
                .user(UserResponse.from(user))
                .build());
    }

    /** Returns the public Google auth configuration needed by the front-end. */
    @GetMapping("/google/config")
    public ResponseEntity<GoogleAuthConfigResponse> getGoogleConfig() {
        return ResponseEntity.ok(googleAuthenticationService.getConfiguration());
    }

    /** Authenticates with Google and stores the Coliclic JWT in an HTTP-only cookie. */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> authenticateWithGoogle(@Valid @RequestBody GoogleAuthRequest request,
                                                               HttpServletResponse response) {
        AuthenticationResult result = googleAuthenticationService.authenticate(request.getIdToken());
        response.addHeader(HttpHeaders.SET_COOKIE, authCookieService.create(result.token()).toString());
        return ResponseEntity.ok(AuthResponse.builder().user(result.user()).build());
    }

    /** Returns the current cookie-authenticated user to Angular SSR and the browser. */
    @GetMapping("/session")
    public ResponseEntity<UserResponse> session(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /** Clears the stateless authentication cookie. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, authCookieService.clear().toString());
        return ResponseEntity.noContent().build();
    }

    /** Materializes the CSRF cookie used by Angular's built-in XSRF support. */
    @GetMapping("/csrf")
    public Map<String, String> csrf(HttpServletRequest request, HttpServletResponse response) {
        CsrfToken token = csrfTokenRepository.generateToken(request);
        csrfTokenRepository.saveToken(token, request, response);
        return Map.of(
                "headerName", token.getHeaderName(),
                "token", token.getToken()
        );
    }

    /**
     * Initiates a forgot password request and always returns a generic response.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<GenericMessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                                                 HttpServletRequest servletRequest) {
        enforceRateLimit(authRateLimiter.checkPasswordReset(request.getEmail(), servletRequest.getRemoteAddr()));
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

    private void enforceRateLimit(RateLimitDecision decision) {
        if (!decision.allowed()) {
            throw new TooManyRequestsException(
                    localizedMessages.get("error.auth.tooManyAttempts"),
                    decision.retryAfterSeconds()
            );
        }
    }
}
