package com.coliclic.backoffice.auth.google;

import com.coliclic.backoffice.auth.dto.AuthResponse;
import com.coliclic.backoffice.auth.dto.GoogleAuthConfigResponse;

public interface GoogleAuthenticationService {

    AuthResponse authenticate(String idToken);

    GoogleAuthConfigResponse getConfiguration();
}
