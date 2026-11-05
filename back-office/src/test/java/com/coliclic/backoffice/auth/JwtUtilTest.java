package com.coliclic.backoffice.auth;

import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.user.entity.User;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private static final long THIRTY_DAYS_IN_MILLISECONDS = 2_592_000_000L;

    @Test
    void sessionVersionRevokesOldTokensAndAcceptsNewOnes() {
        JwtUtil jwt = new JwtUtil("test-secret-key-must-be-at-least-32-chars-long", THIRTY_DAYS_IN_MILLISECONDS);
        User user = User.builder().id(1L).email("user@example.com").password("old-hash").build();
        String oldToken = jwt.generateToken(user);
        assertThat(jwt.isTokenValid(oldToken, user)).isTrue();
        user.setPassword("new-hash");
        assertThat(jwt.isTokenValid(oldToken, user)).isFalse();
        assertThat(jwt.isTokenValid(jwt.generateToken(user), user)).isTrue();
    }

    @Test
    void rejectsLegacyTokensAndTokensForAnEmailReassignedToAnotherAccount() {
        String secret = "test-secret-key-must-be-at-least-32-chars-long";
        JwtUtil jwt = new JwtUtil(secret, THIRTY_DAYS_IN_MILLISECONDS);
        User original = User.builder().id(1L).email("user@example.com").build();
        User replacement = User.builder().id(2L).email("user@example.com").build();
        assertThat(jwt.isTokenValid(jwt.generateToken(original), replacement)).isFalse();
        String legacyToken = io.jsonwebtoken.Jwts.builder().subject(original.getEmail())
                .claim("userId", original.getId()).expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                .compact();
        assertThat(jwt.isTokenValid(legacyToken, original)).isFalse();
    }

    @Test
    void rejectsWeakSigningSecrets() {
        assertThatThrownBy(() -> new JwtUtil("short", THIRTY_DAYS_IN_MILLISECONDS))
                .isInstanceOf(io.jsonwebtoken.security.WeakKeyException.class);
    }

    @Test
    void generateToken_shouldExpireThirtyDaysAfterItIsIssued() {
        JwtUtil jwtUtil = new JwtUtil(
                "test-secret-key-must-be-at-least-32-chars-long",
                THIRTY_DAYS_IN_MILLISECONDS
        );
        User user = User.builder()
                .id(1L)
                .email("john@example.com")
                .role(User.Role.USER)
                .build();
        Instant beforeGeneration = Instant.now();

        String token = jwtUtil.generateToken(user);

        Date expiration = jwtUtil.extractClaims(token).getExpiration();
        assertThat(expiration.toInstant())
                .isBetween(
                        beforeGeneration.plus(Duration.ofDays(30)).minusSeconds(1),
                        Instant.now().plus(Duration.ofDays(30)).plusSeconds(1)
                );
    }
}
