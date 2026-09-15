package com.coliclic.backoffice.auth.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RedisAuthRateLimiterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    private RedisAuthRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new RedisAuthRateLimiter(
                redisTemplate,
                10,
                30,
                Duration.ofMinutes(15),
                3,
                10,
                Duration.ofHours(1)
        );
    }

    @Test
    void checkLogin_shouldUseHashedNormalizedEmailAndAddressKeys() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(),
                eq("10"), eq("30"), eq("900000"))).thenReturn(0L);

        RateLimitDecision decision = rateLimiter.checkLogin("  User@Example.com ", "203.0.113.7");

        assertThat(decision.allowed()).isTrue();
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> keysCaptor = ArgumentCaptor.forClass(List.class);
        verify(redisTemplate).execute(any(RedisScript.class), keysCaptor.capture(),
                eq("10"), eq("30"), eq("900000"));
        assertThat(keysCaptor.getValue()).allSatisfy(key -> {
            assertThat(key).doesNotContain("User", "user@example.com", "203.0.113.7");
            assertThat(key).matches("auth:rate-limit:login:(email|ip):[0-9a-f]{64}");
        });
    }

    @Test
    void checkPasswordReset_shouldReturnRoundedRetryAfter() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(),
                eq("3"), eq("10"), eq("3600000"))).thenReturn(42_001L);

        RateLimitDecision decision = rateLimiter.checkPasswordReset("user@example.com", "203.0.113.7");

        assertThat(decision.allowed()).isFalse();
        assertThat(decision.retryAfterSeconds()).isEqualTo(43);
    }

    @Test
    void checkLogin_shouldFailOpenWhenRedisIsUnavailable() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(),
                any(), any(), any())).thenThrow(new IllegalStateException("Redis unavailable"));

        RateLimitDecision decision = rateLimiter.checkLogin("user@example.com", "203.0.113.7");

        assertThat(decision).isEqualTo(RateLimitDecision.allowedDecision());
    }
}
