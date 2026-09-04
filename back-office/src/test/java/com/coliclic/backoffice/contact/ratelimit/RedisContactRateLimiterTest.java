package com.coliclic.backoffice.contact.ratelimit;

import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisContactRateLimiterTest {
    @Test
    void usesHashedKeysAndConfiguredLimits() {
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        RedisContactRateLimiter limiter = new RedisContactRateLimiter(redisTemplate, 3, 10, Duration.ofMinutes(15));
        when(redisTemplate.execute(any(RedisScript.class), anyList(), eq("3"), eq("10"), eq("900000"))).thenReturn(0L);

        RateLimitDecision decision = limiter.check(" Ada@Example.com ", "203.0.113.7");

        assertThat(decision.allowed()).isTrue();
        @SuppressWarnings("unchecked") ArgumentCaptor<List<String>> captor = ArgumentCaptor.forClass(List.class);
        verify(redisTemplate).execute(any(RedisScript.class), captor.capture(), eq("3"), eq("10"), eq("900000"));
        assertThat(captor.getValue()).allSatisfy(key -> assertThat(key).matches("contact:rate-limit:(email|ip):[0-9a-f]{64}"));
    }
}
