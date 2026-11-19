package com.coliclic.backoffice.contact;

import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;

@Service
public class TurnstileVerifier {
    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private static final List<String> SERVICE_ERRORS =
            List.of("internal-error", "missing-input-secret", "invalid-input-secret");

    private final RestClient client;
    private final String secretKey;
    private final LocalizedMessages messages;

    public TurnstileVerifier(RestClient.Builder builder,
                            @Value("${app.contact.turnstile.secret-key}") String secretKey,
                            LocalizedMessages messages) {
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        this.client = builder.requestFactory(requestFactory).build();
        this.secretKey = secretKey.trim();
        this.messages = messages;
    }

    public boolean verify(String token) {
        if (secretKey.isEmpty()) {
            throw unavailable();
        }

        VerificationResponse response;
        try {
            response = client.post()
                    .uri(VERIFY_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new VerificationRequest(secretKey, token))
                    .retrieve()
                    .body(VerificationResponse.class);
        } catch (RestClientException ex) {
            throw unavailable();
        }

        if (response == null || response.success() == null
                || (response.errorCodes() != null && response.errorCodes().stream().anyMatch(SERVICE_ERRORS::contains))) {
            throw unavailable();
        }
        return response.success();
    }

    private ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                messages.get("error.contact.turnstile.unavailable"));
    }

    private record VerificationRequest(String secret, String response) {}
    private record VerificationResponse(Boolean success, @JsonProperty("error-codes") List<String> errorCodes) {}
}
