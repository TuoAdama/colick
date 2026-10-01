package com.coliclic.backoffice.messaging.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisMessageEmailNotificationThrottleTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RedisMessageEmailNotificationThrottle throttle;

    @BeforeEach
    void setUp() {
        throttle = new RedisMessageEmailNotificationThrottle(redisTemplate, Duration.ofMinutes(10));
    }

    @Test
    void tryAcquire_shouldReserveKeyWithConfiguredCooldown() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(
                "messaging:email-notification:100:2", "1", Duration.ofMinutes(10)))
                .thenReturn(true);

        boolean acquired = throttle.tryAcquire(100L, 2L);

        assertThat(acquired).isTrue();
    }

    @Test
    void tryAcquire_shouldRejectWhenWindowAlreadyExists() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenReturn(false);

        assertThat(throttle.tryAcquire(100L, 2L)).isFalse();
    }

    @Test
    void tryAcquire_shouldFailOpenWhenRedisIsUnavailable() {
        when(redisTemplate.opsForValue()).thenThrow(new IllegalStateException("Redis unavailable"));

        assertThat(throttle.tryAcquire(100L, 2L)).isTrue();
    }

    @Test
    void release_shouldDeleteConversationRecipientKey() {
        throttle.release(100L, 2L);

        verify(redisTemplate).delete("messaging:email-notification:100:2");
    }

    @Test
    void release_shouldIgnoreRedisFailure() {
        when(redisTemplate.delete(anyString())).thenThrow(new IllegalStateException("Redis unavailable"));

        assertThatCode(() -> throttle.release(100L, 2L)).doesNotThrowAnyException();
    }
}
