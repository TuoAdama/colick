package com.colick.backoffice.auth.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Public Google auth configuration needed by the front-end.
 */
@Data
@Builder
public class GoogleAuthConfigResponse {

    private boolean enabled;
    private String clientId;
}
