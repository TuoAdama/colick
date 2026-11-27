package com.coliclic.backoffice.contact;

import com.coliclic.backoffice.i18n.LocalizedMessages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class TurnstileVerifierTest {
    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private MockRestServiceServer server;
    private TurnstileVerifier verifier;

    @BeforeEach
    void setUp() {
        var builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        // Keep the mock request factory while the verifier configures its network timeouts.
        var configuredBuilder = mock(RestClient.Builder.class);
        when(configuredBuilder.requestFactory(any())).thenReturn(builder);
        verifier = new TurnstileVerifier(configuredBuilder, "private-key", mock(LocalizedMessages.class));
    }

    @Test
    void checksTheTokenWithCloudflareUsingTheSecret() {
        server.expect(requestTo(VERIFY_URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {"secret":"private-key","response":"verified-token"}
                        """))
                .andRespond(withSuccess("{\"success\":true,\"hostname\":\"example.com\"}", MediaType.APPLICATION_JSON));

        assertTrue(verifier.verify("verified-token"));
        server.verify();
    }

    @Test
    void rejectsExpiredOrReusedTokens() {
        server.expect(requestTo(VERIFY_URL))
                .andRespond(withSuccess("""
                        {"success":false,"error-codes":["timeout-or-duplicate"]}
                        """, MediaType.APPLICATION_JSON));

        assertFalse(verifier.verify("expired-token"));
        server.verify();
    }

    @Test
    void failsClosedWhenCloudflareIsUnavailable() {
        server.expect(requestTo(VERIFY_URL)).andRespond(withServerError());

        var error = assertThrows(ResponseStatusException.class, () -> verifier.verify("token"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
        server.verify();
    }

    @Test
    void failsClosedWhenTheSecretIsMissing() {
        var unconfigured = new TurnstileVerifier(RestClient.builder(), "", mock(LocalizedMessages.class));

        var error = assertThrows(ResponseStatusException.class, () -> unconfigured.verify("token"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatusCode());
    }
}
