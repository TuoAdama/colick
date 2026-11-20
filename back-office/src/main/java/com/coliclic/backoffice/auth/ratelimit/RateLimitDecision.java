package com.coliclic.backoffice.auth.ratelimit;

/**
 * Result of a rate-limit check. A rejected decision carries the number of
 * seconds before the current fixed window expires.
 */
public record RateLimitDecision(boolean allowed, long retryAfterSeconds) {

    public static RateLimitDecision allowedDecision() {
        return new RateLimitDecision(true, 0);
    }

    public static RateLimitDecision rejected(long retryAfterSeconds) {
        return new RateLimitDecision(false, Math.max(1, retryAfterSeconds));
    }
}
