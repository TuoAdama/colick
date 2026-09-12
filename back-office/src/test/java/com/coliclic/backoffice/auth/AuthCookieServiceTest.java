package com.coliclic.backoffice.auth;

import com.coliclic.backoffice.auth.cookie.AuthCookieService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class AuthCookieServiceTest {

    private static final long THIRTY_DAYS_IN_MILLISECONDS = 2_592_000_000L;
    private static final long THIRTY_DAYS_IN_SECONDS = 2_592_000L;

    @Test
    void create_shouldUseSsrCompatibleSecurityAttributes() {
        AuthCookieService service = new AuthCookieService("COLICLIC_AUTH", true, THIRTY_DAYS_IN_MILLISECONDS);

        var cookie = service.create("signed-jwt");

        assertThat(cookie.getName()).isEqualTo("COLICLIC_AUTH");
        assertThat(cookie.getValue()).isEqualTo("signed-jwt");
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.isSecure()).isTrue();
        assertThat(cookie.getSameSite()).isEqualTo("Lax");
        assertThat(cookie.getPath()).isEqualTo("/");
        assertThat(cookie.getMaxAge()).hasSeconds(THIRTY_DAYS_IN_SECONDS);
    }

    @Test
    void readAndClear_shouldUseConfiguredCookieName() {
        AuthCookieService service = new AuthCookieService("COLICLIC_AUTH", false, THIRTY_DAYS_IN_MILLISECONDS);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("COLICLIC_AUTH", "signed-jwt"));

        assertThat(service.readToken(request)).isEqualTo("signed-jwt");
        assertThat(service.clear().getMaxAge()).isZero();
        assertThat(service.clear().getValue()).isEmpty();
    }
}
