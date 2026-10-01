package com.coliclic.backoffice.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class DeploymentCorsConfigurationTest {

    @Test
    void preprodCompose_shouldOverrideCorsOriginWithPreprodDomain() throws IOException {
        String compose = Files.readString(Path.of("..", "deploy", "compose.preprod.yml"));

        assertThat(compose)
                .contains("CORS_ALLOWED_ORIGINS: \"https://preprod.coliclic.com\"")
                .doesNotContain("CORS_ALLOWED_ORIGINS: \"https://coliclic.com\"");
    }

    @Test
    void productionCompose_shouldOverrideCorsOriginWithProductionDomain() throws IOException {
        String compose = Files.readString(Path.of("..", "deploy", "compose.production.yml"));

        assertThat(compose)
                .contains("CORS_ALLOWED_ORIGINS: \"https://coliclic.com\"")
                .doesNotContain("CORS_ALLOWED_ORIGINS: \"https://preprod.coliclic.com\"");
    }
}
