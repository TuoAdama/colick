package com.colick.backoffice.auth.google;

import com.colick.backoffice.exception.BadRequestException;
import com.colick.backoffice.i18n.LocalizedMessages;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

/**
 * Verifies Google ID tokens received from the front-end.
 */
@Service
public class GoogleTokenVerifierService implements GoogleTokenVerifier {

    private final String clientId;
    private final LocalizedMessages localizedMessages;

    public GoogleTokenVerifierService(@Value("${app.auth.google.client-id:}") String clientId,
                                      LocalizedMessages localizedMessages) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.localizedMessages = localizedMessages;
    }

    @Override
    public GoogleTokenPayload verify(String idToken) {
        if (!isConfigured()) {
            throw new BadRequestException(localizedMessages.get("error.google.notConfigured"));
        }
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException(localizedMessages.get("error.google.tokenRequired"));
        }

        GoogleIdToken googleIdToken;
        try {
            googleIdToken = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(List.of(clientId))
                    .build()
                    .verify(idToken);
        } catch (GeneralSecurityException | IOException ex) {
            throw new BadRequestException(localizedMessages.get("error.google.verificationFailed"));
        }

        if (googleIdToken == null) {
            throw new AccessDeniedException(localizedMessages.get("error.google.invalidToken"));
        }

        GoogleIdToken.Payload payload = googleIdToken.getPayload();
        if (!Boolean.TRUE.equals(payload.getEmailVerified())
                || payload.getEmail() == null || payload.getEmail().isBlank()
                || payload.getSubject() == null || payload.getSubject().isBlank()) {
            throw new AccessDeniedException(localizedMessages.get("error.google.emailNotVerified"));
        }

        return new GoogleTokenPayload(
                payload.getSubject(),
                payload.getEmail(),
                readString(payload, "given_name"),
                readString(payload, "family_name"),
                (String) payload.get("name"),
                true
        );
    }

    @Override
    public boolean isConfigured() {
        return !clientId.isBlank();
    }

    @Override
    public String getClientId() {
        return clientId;
    }

    private String readString(GoogleIdToken.Payload payload, String key) {
        Object value = payload.get(key);
        return value instanceof String text ? text : null;
    }
}
