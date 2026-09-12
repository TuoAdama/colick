package com.coliclic.backoffice.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiConfigTest {

    @Test
    void exposesColiclicBranding() {
        OpenAPI openAPI = new OpenApiConfig().coliclicOpenAPI();

        assertThat(openAPI.getInfo().getTitle()).isEqualTo("Coliclic API");
        assertThat(openAPI.getInfo().getDescription()).contains("Coliclic");
    }
}
