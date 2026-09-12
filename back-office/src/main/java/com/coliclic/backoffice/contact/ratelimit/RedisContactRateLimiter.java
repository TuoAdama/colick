package com.coliclic.backoffice.contact.ratelimit;

import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Component
public class RedisContactRateLimiter implements ContactRateLimiter {
    private static final Logger log = LoggerFactory.getLogger(RedisContactRateLimiter.class);
    private static final String KEY_PREFIX = "contact:rate-limit:";
    private static final DefaultRedisScript<Long> CHECK_SCRIPT = new DefaultRedisScript<>("""
            local emailCount = redis.call('INCR', KEYS[1])
            if emailCount == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[3]) end
            local addressCount = redis.call('INCR', KEYS[2])
            if addressCount == 1 then redis.call('PEXPIRE', KEYS[2], ARGV[3]) end
            local emailExceeded = emailCount > tonumber(ARGV[1])
            local addressExceeded = addressCount > tonumber(ARGV[2])
            if not emailExceeded and not addressExceeded then return 0 end
            local retryAfter = 1000
            if emailExceeded then retryAfter = math.max(retryAfter, redis.call('PTTL', KEYS[1])) end
            if addressExceeded then retryAfter = math.max(retryAfter, redis.call('PTTL', KEYS[2])) end
            return retryAfter
            """, Long.class);

    private final StringRedisTemplate redisTemplate;
    private final int emailLimit;
    private final int ipLimit;
    private final Duration window;

    public RedisContactRateLimiter(StringRedisTemplate redisTemplate,
                                   @Value("${app.contact.rate-limit.email-limit:3}") int emailLimit,
                                   @Value("${app.contact.rate-limit.ip-limit:10}") int ipLimit,
                                   @Value("${app.contact.rate-limit.window:15m}") Duration window) {
        this.redisTemplate = redisTemplate;
        this.emailLimit = emailLimit;
        this.ipLimit = ipLimit;
        this.window = window;
    }

    @Override
    public RateLimitDecision check(String email, String clientAddress) {
        try {
            Long retryAfterMillis = redisTemplate.execute(CHECK_SCRIPT,
                    List.of(KEY_PREFIX + "email:" + hash(normalizeEmail(email)),
                            KEY_PREFIX + "ip:" + hash(normalizeAddress(clientAddress))),
                    Integer.toString(emailLimit), Integer.toString(ipLimit), Long.toString(window.toMillis()));
            return retryAfterMillis == null || retryAfterMillis <= 0
                    ? RateLimitDecision.allowedDecision()
                    : RateLimitDecision.rejected((retryAfterMillis + 999) / 1000);
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable while rate limiting contact request; allowing request", ex);
            return RateLimitDecision.allowedDecision();
        }
    }

    private String normalizeEmail(String email) { return email == null ? "" : email.trim().toLowerCase(Locale.ROOT); }
    private String normalizeAddress(String address) { return address == null || address.isBlank() ? "unknown" : address.trim(); }
    private String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException ex) { throw new IllegalStateException("SHA-256 is unavailable", ex); }
    }
}
