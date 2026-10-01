package com.coliclic.backoffice.auth.google;

import com.coliclic.backoffice.auth.dto.AuthenticationResult;
import com.coliclic.backoffice.auth.dto.GoogleAuthConfigResponse;

public interface GoogleAuthenticationService {

    AuthenticationResult authenticate(String idToken);

    GoogleAuthConfigResponse getConfiguration();
}
