package com.coliclic.backoffice.auth.ratelimit;

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

/**
 * Redis-backed fixed-window limiter. Both the identifier and client-address
 * counters are incremented atomically, and e-mail addresses are never stored
 * in clear text.
 */
@Component
public class RedisAuthRateLimiter implements AuthRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(RedisAuthRateLimiter.class);
    private static final String KEY_PREFIX = "auth:rate-limit:";
    private static final DefaultRedisScript<Long> CHECK_SCRIPT = new DefaultRedisScript<>("""
            local identifierCount = redis.call('INCR', KEYS[1])
            if identifierCount == 1 then
              redis.call('PEXPIRE', KEYS[1], ARGV[3])
            end
            local addressCount = redis.call('INCR', KEYS[2])
            if addressCount == 1 then
              redis.call('PEXPIRE', KEYS[2], ARGV[3])
            end
            if identifierCount <= tonumber(ARGV[1]) and addressCount <= tonumber(ARGV[2]) then
              return 0
            end
            local identifierTtl = redis.call('PTTL', KEYS[1])
            local addressTtl = redis.call('PTTL', KEYS[2])
            return math.max(identifierTtl, addressTtl, 1000)
            """, Long.class);

    private final StringRedisTemplate redisTemplate;
    private final int loginEmailLimit;
    private final int loginIpLimit;
    private final Duration loginWindow;
    private final int passwordResetEmailLimit;
    private final int passwordResetIpLimit;
    private final Duration passwordResetWindow;

    public RedisAuthRateLimiter(
            StringRedisTemplate redisTemplate,
            @Value("${app.auth.rate-limit.login.email-limit:10}") int loginEmailLimit,
            @Value("${app.auth.rate-limit.login.ip-limit:30}") int loginIpLimit,
            @Value("${app.auth.rate-limit.login.window:15m}") Duration loginWindow,
            @Value("${app.auth.rate-limit.password-reset.email-limit:3}") int passwordResetEmailLimit,
            @Value("${app.auth.rate-limit.password-reset.ip-limit:10}") int passwordResetIpLimit,
            @Value("${app.auth.rate-limit.password-reset.window:60m}") Duration passwordResetWindow) {
        this.redisTemplate = redisTemplate;
        this.loginEmailLimit = loginEmailLimit;
        this.loginIpLimit = loginIpLimit;
        this.loginWindow = loginWindow;
        this.passwordResetEmailLimit = passwordResetEmailLimit;
        this.passwordResetIpLimit = passwordResetIpLimit;
        this.passwordResetWindow = passwordResetWindow;
    }

    @Override
    public RateLimitDecision checkLogin(String email, String clientAddress) {
        return check("login", email, clientAddress, loginEmailLimit, loginIpLimit, loginWindow);
    }

    @Override
    public RateLimitDecision checkPasswordReset(String email, String clientAddress) {
        return check("password-reset", email, clientAddress,
                passwordResetEmailLimit, passwordResetIpLimit, passwordResetWindow);
    }

    private RateLimitDecision check(String operation,
                                    String email,
                                    String clientAddress,
                                    int emailLimit,
                                    int ipLimit,
                                    Duration window) {
        String emailKey = KEY_PREFIX + operation + ":email:" + hash(normalizeEmail(email));
        String ipKey = KEY_PREFIX + operation + ":ip:" + hash(normalizeAddress(clientAddress));
        try {
            Long retryAfterMillis = redisTemplate.execute(
                    CHECK_SCRIPT,
                    List.of(emailKey, ipKey),
                    Integer.toString(emailLimit),
                    Integer.toString(ipLimit),
                    Long.toString(window.toMillis())
            );
            if (retryAfterMillis == null || retryAfterMillis <= 0) {
                return RateLimitDecision.allowedDecision();
            }
            return RateLimitDecision.rejected((retryAfterMillis + 999) / 1000);
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable while rate limiting authentication operation {}; allowing request",
                    operation, ex);
            return RateLimitDecision.allowedDecision();
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeAddress(String clientAddress) {
        return clientAddress == null || clientAddress.isBlank() ? "unknown" : clientAddress.trim();
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
