package com.coliclic.backoffice.messaging.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Redis-backed, distributed notification throttle using an atomic SET NX.
 */
@Component
public class RedisMessageEmailNotificationThrottle implements MessageEmailNotificationThrottle {

    private static final Logger log = LoggerFactory.getLogger(RedisMessageEmailNotificationThrottle.class);
    private static final String KEY_PREFIX = "messaging:email-notification:";

    private final StringRedisTemplate redisTemplate;
    private final Duration cooldown;

    public RedisMessageEmailNotificationThrottle(
            StringRedisTemplate redisTemplate,
            @Value("${app.messaging.email-notification.cooldown:10m}") Duration cooldown) {
        this.redisTemplate = redisTemplate;
        this.cooldown = cooldown;
    }

    @Override
    public boolean tryAcquire(Long conversationId, Long recipientId) {
        String key = buildKey(conversationId, recipientId);
        try {
            return Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(key, "1", cooldown));
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable while throttling message email for conversation {} and recipient {}; allowing send",
                    conversationId, recipientId, ex);
            return true;
        }
    }

    @Override
    public void release(Long conversationId, Long recipientId) {
        try {
            redisTemplate.delete(buildKey(conversationId, recipientId));
        } catch (RuntimeException ex) {
            log.warn("Unable to clear message email throttle for conversation {} and recipient {}",
                    conversationId, recipientId, ex);
        }
    }

    private String buildKey(Long conversationId, Long recipientId) {
        return KEY_PREFIX + conversationId + ":" + recipientId;
    }
}
