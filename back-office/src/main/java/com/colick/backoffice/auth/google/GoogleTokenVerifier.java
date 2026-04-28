package com.colick.backoffice.auth.google;

public interface GoogleTokenVerifier {

    GoogleTokenPayload verify(String idToken);

    boolean isConfigured();

    String getClientId();
}
