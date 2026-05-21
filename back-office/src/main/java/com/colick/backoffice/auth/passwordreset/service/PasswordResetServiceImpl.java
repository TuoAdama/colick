package com.colick.backoffice.auth.passwordreset.service;

import com.colick.backoffice.auth.passwordreset.entity.PasswordResetToken;
import com.colick.backoffice.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.BadRequestException;
import com.colick.backoffice.i18n.LocalizedMessages;
import com.colick.backoffice.user.entity.User;
import com.colick.backoffice.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Default implementation of password reset flow.
 */
@Service
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final LocalizedMessages localizedMessages;

    @Value("${app.auth.password-reset.base-url}")
    private String resetBaseUrl;

    @Value("${app.auth.password-reset.expiration-minutes:60}")
    private long expirationMinutes;

    public PasswordResetServiceImpl(UserRepository userRepository,
                                    PasswordResetTokenRepository passwordResetTokenRepository,
                                    PasswordEncoder passwordEncoder,
                                    EmailService emailService,
                                    LocalizedMessages localizedMessages) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.localizedMessages = localizedMessages;
    }

    @Override
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String rawToken = generateToken();
            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(hashToken(rawToken))
                    .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                    .build();
            passwordResetTokenRepository.save(token);

            emailService.sendPasswordResetEmail(
                    user.getEmail(),
                    user.getFirstName(),
                    buildResetUrl(rawToken),
                    expirationMinutes
            );
        });

        passwordResetTokenRepository.deleteAllByExpiresAtBefore(LocalDateTime.now());
    }

    @Override
    public void resetPassword(String rawToken, String newPassword) {
        String hashedToken = hashToken(rawToken);
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(hashedToken)
                .orElseThrow(() -> new BadRequestException(localizedMessages.get("error.passwordReset.invalidToken")));

        if (token.isUsed()) {
            throw new BadRequestException(localizedMessages.get("error.passwordReset.tokenUsed"));
        }

        if (token.isExpired()) {
            throw new BadRequestException(localizedMessages.get("error.passwordReset.tokenExpired"));
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setLocalAuthEnabled(true);
        userRepository.save(user);

        LocalDateTime now = LocalDateTime.now();
        passwordResetTokenRepository.findAllByUserAndUsedAtIsNull(user)
                .forEach(activeToken -> activeToken.setUsedAt(now));
    }

    private String generateToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(localizedMessages.get("error.system.sha256Unavailable"), e);
        }
    }

    private String buildResetUrl(String rawToken) {
        String baseUrl = resetBaseUrl == null ? "" : resetBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "?token=" + rawToken;
    }
}
