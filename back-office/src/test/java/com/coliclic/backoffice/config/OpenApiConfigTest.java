package com.coliclic.backoffice.config;

import com.coliclic.backoffice.commercial.CommercialMode;
import com.coliclic.backoffice.commercial.CommercialProperties;
import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiConfigTest {

    @Test
    void exposesColiclicBranding() {
        CommercialProperties properties = new CommercialProperties();
        OpenAPI openAPI = new OpenApiConfig(properties).coliclicOpenAPI();

        assertThat(openAPI.getInfo().getTitle()).isEqualTo("Coliclic API");
        assertThat(openAPI.getInfo().getDescription()).contains("Coliclic");
        assertThat(openAPI.getInfo().getDescription()).contains(CommercialMode.FREE.name());
    }

    @Test
    void exposesTheConfiguredCommercialMode() {
        CommercialProperties properties = new CommercialProperties();
        properties.setMode(CommercialMode.COMMISSION);

        OpenAPI openAPI = new OpenApiConfig(properties).coliclicOpenAPI();

        assertThat(openAPI.getInfo().getDescription()).contains(CommercialMode.COMMISSION.name());
    }
}
