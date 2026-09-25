package com.coliclic.backoffice.contact.ratelimit;

import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;

/** Distributed abuse protection for the anonymous contact endpoint. */
public interface ContactRateLimiter {
    RateLimitDecision check(String email, String clientAddress);
}
