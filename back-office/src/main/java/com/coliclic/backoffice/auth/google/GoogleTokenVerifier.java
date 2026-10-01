package com.coliclic.backoffice.auth.google;

public interface GoogleTokenVerifier {

    GoogleTokenPayload verify(String idToken);

    boolean isConfigured();

    String getClientId();
}
