package com.coliclic.backoffice.auth.google;

import com.coliclic.backoffice.auth.dto.AuthResponse;
import com.coliclic.backoffice.auth.dto.GoogleAuthConfigResponse;
import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.user.dto.UserResponse;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.UUID;

/**
 * Creates or links Coliclic users from verified Google identities.
 */
@Service
@Transactional
public class GoogleAuthenticationServiceImpl implements GoogleAuthenticationService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final PasswordEncoder passwordEncoder;
    private final LocalizedMessages localizedMessages;

    public GoogleAuthenticationServiceImpl(UserRepository userRepository,
                                           JwtUtil jwtUtil,
                                           GoogleTokenVerifier googleTokenVerifier,
                                           PasswordEncoder passwordEncoder,
                                           LocalizedMessages localizedMessages) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.googleTokenVerifier = googleTokenVerifier;
        this.passwordEncoder = passwordEncoder;
        this.localizedMessages = localizedMessages;
    }

    @Override
    public AuthResponse authenticate(String idToken) {
        GoogleTokenPayload payload = googleTokenVerifier.verify(idToken);
        User user = userRepository.findByGoogleSubject(payload.subject())
                .map(existingUser -> synchronizeLinkedUser(existingUser, payload))
                .orElseGet(() -> resolveByEmailOrCreate(payload));

        User savedUser = userRepository.save(user);
        return AuthResponse.builder()
                .token(jwtUtil.generateToken(savedUser))
                .type("Bearer")
                .user(UserResponse.from(savedUser))
                .build();
    }

    @Override
    public GoogleAuthConfigResponse getConfiguration() {
        boolean enabled = googleTokenVerifier.isConfigured();
        return GoogleAuthConfigResponse.builder()
                .enabled(enabled)
                .clientId(enabled ? googleTokenVerifier.getClientId() : null)
                .build();
    }

    private User resolveByEmailOrCreate(GoogleTokenPayload payload) {
        return userRepository.findByEmail(payload.email())
                .map(existingUser -> linkExistingUser(existingUser, payload))
                .orElseGet(() -> createGoogleUser(payload));
    }

    private User synchronizeLinkedUser(User user, GoogleTokenPayload payload) {
        activateIfNeeded(user);
        fillMissingNames(user, payload);
        if (user.getAuthProvider() == null) {
            user.setAuthProvider(User.AuthProvider.LOCAL);
        }
        return user;
    }

    private User linkExistingUser(User user, GoogleTokenPayload payload) {
        if (user.getGoogleSubject() != null && !user.getGoogleSubject().equals(payload.subject())) {
            throw new AccessDeniedException(localizedMessages.get("error.google.accountAlreadyLinked"));
        }

        user.setGoogleSubject(payload.subject());
        activateIfNeeded(user);
        fillMissingNames(user, payload);
        if (user.getAuthProvider() == null) {
            user.setAuthProvider(User.AuthProvider.LOCAL);
        }
        return user;
    }

    private User createGoogleUser(GoogleTokenPayload payload) {
        return User.builder()
                .firstName(resolveFirstName(payload))
                .lastName(resolveLastName(payload))
                .email(payload.email())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .localAuthEnabled(false)
                .enabled(true)
                .authProvider(User.AuthProvider.GOOGLE)
                .googleSubject(payload.subject())
                .role(User.Role.USER)
                .build();
    }

    private void activateIfNeeded(User user) {
        if (Boolean.FALSE.equals(user.getEnabled())) {
            user.setEnabled(true);
            user.setSignupConfirmToken(null);
            user.setSignupConfirmTokenExpiresAt(null);
        }
    }

    private void fillMissingNames(User user, GoogleTokenPayload payload) {
        if (!hasText(user.getFirstName())) {
            user.setFirstName(resolveFirstName(payload));
        }
        if (!hasText(user.getLastName())) {
            user.setLastName(resolveLastName(payload));
        }
    }

    private String resolveFirstName(GoogleTokenPayload payload) {
        if (hasText(payload.firstName())) {
            return payload.firstName().trim();
        }
        if (hasText(payload.fullName())) {
            return payload.fullName().trim().split("\\s+")[0];
        }
        if (hasText(payload.email())) {
            return payload.email().substring(0, payload.email().indexOf('@'));
        }
        return "Utilisateur";
    }

    private String resolveLastName(GoogleTokenPayload payload) {
        if (hasText(payload.lastName())) {
            return payload.lastName().trim();
        }
        if (hasText(payload.fullName())) {
            String[] parts = payload.fullName().trim().split("\\s+");
            if (parts.length > 1) {
                return String.join(" ", Arrays.copyOfRange(parts, 1, parts.length));
            }
        }
        return "Google";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
