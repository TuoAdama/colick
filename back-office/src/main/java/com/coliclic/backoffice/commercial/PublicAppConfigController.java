package com.coliclic.backoffice.commercial;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
public class PublicAppConfigController {

    private final CommercialProperties commercialProperties;

    public PublicAppConfigController(CommercialProperties commercialProperties) {
        this.commercialProperties = commercialProperties;
    }

    @GetMapping("/app-config")
    @Operation(summary = "Get the public application and commercial configuration")
    public PublicAppConfigResponse getAppConfig() {
        return PublicAppConfigResponse.from(commercialProperties);
    }
}
