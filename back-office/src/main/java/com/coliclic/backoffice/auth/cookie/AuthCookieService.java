package com.coliclic.backoffice.auth.cookie;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

import java.time.Duration;

/** Creates and reads the stateless JWT cookie shared by Angular SSR and Spring. */
@Component
public class AuthCookieService {

    private final String cookieName;
    private final boolean secure;
    private final Duration maxAge;

    public AuthCookieService(
            @Value("${app.auth.cookie.name:COLICLIC_AUTH}") String cookieName,
            @Value("${app.auth.cookie.secure:false}") boolean secure,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.cookieName = cookieName;
        this.secure = secure;
        this.maxAge = Duration.ofMillis(expirationMs);
    }

    public String readToken(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, cookieName);
        return cookie == null ? null : cookie.getValue();
    }

    public ResponseCookie create(String token) {
        return baseCookie(token).maxAge(maxAge).build();
    }

    public ResponseCookie clear() {
        return baseCookie("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/");
    }
}
