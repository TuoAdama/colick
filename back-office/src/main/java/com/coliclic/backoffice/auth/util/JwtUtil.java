package com.coliclic.backoffice.auth.util;

import com.coliclic.backoffice.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility class for generating and validating JWT tokens.
 */
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /** Generates a signed JWT token for the given user. */
    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .claim("userId", user.getId())
                .claim("sessionVersion", user.getSessionVersion())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(secretKey)
                .compact();
    }

    /** Extracts all claims from a JWT token. */
    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Extracts the subject (email) from a JWT token. */
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    /** Returns true if the token is valid and not expired. */
    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    /** Rejects revoked, legacy, disabled-account and reassigned-email sessions. */
    public boolean isTokenValid(String token, User user) {
        try {
            Claims claims = extractClaims(token);
            Number version = claims.get("sessionVersion", Number.class);
            Number userId = claims.get("userId", Number.class);
            // Legacy NULL activation flags are allowed by both local and Google sign-in.
            return !Boolean.FALSE.equals(user.getEnabled())
                    && claims.getExpiration().after(new Date())
                    && user.getEmail().equals(claims.getSubject())
                    && userId != null && user.getId().equals(userId.longValue())
                    && version != null && version.longValue() == user.getSessionVersion();
        } catch (Exception ex) {
            return false;
        }
    }
}
