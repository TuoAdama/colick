package com.coliclic.backoffice.auth.ratelimit;

/**
 * Distributed abuse protection for public authentication endpoints.
 */
public interface AuthRateLimiter {

    RateLimitDecision checkLogin(String email, String clientAddress);

    RateLimitDecision checkPasswordReset(String email, String clientAddress);
}
