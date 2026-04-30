package com.colick.backoffice.auth.google;

import com.colick.backoffice.auth.dto.AuthResponse;
import com.colick.backoffice.auth.dto.GoogleAuthConfigResponse;

public interface GoogleAuthenticationService {

    AuthResponse authenticate(String idToken);

    GoogleAuthConfigResponse getConfiguration();
}
