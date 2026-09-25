package com.coliclic.backoffice.auth;

import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.user.entity.User;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private static final long THIRTY_DAYS_IN_MILLISECONDS = 2_592_000_000L;

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
