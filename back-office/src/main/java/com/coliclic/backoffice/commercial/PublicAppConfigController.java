package com.coliclic.backoffice.commercial;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
public class PublicAppConfigController {

    private final CommercialProperties commercialProperties;
    private final AnalyticsProperties analyticsProperties;
    private final String contactTurnstileSiteKey;

    public PublicAppConfigController(CommercialProperties commercialProperties,
                                     AnalyticsProperties analyticsProperties,
                                     @Value("${app.contact.turnstile.site-key}") String contactTurnstileSiteKey) {
        this.commercialProperties = commercialProperties;
        this.analyticsProperties = analyticsProperties;
        this.contactTurnstileSiteKey = contactTurnstileSiteKey;
    }

    @GetMapping("/app-config")
    @Operation(summary = "Get the public application and commercial configuration")
    public PublicAppConfigResponse getAppConfig() {
        return PublicAppConfigResponse.from(commercialProperties, analyticsProperties.getMeasurementId(),
                contactTurnstileSiteKey);
    }
}
