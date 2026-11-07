package com.coliclic.backoffice.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockEnvironment;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class DatasourceConfigurationTest {

    @Test
    void shouldPreferPostgresContainerCredentialsOverLegacyDatabaseVariables() throws IOException {
        ConfigurableEnvironment environment = applicationEnvironment()
                .withProperty("DB_HOST", "postgres")
                .withProperty("DB_PORT", "5432")
                .withProperty("POSTGRES_DB", "container_database")
                .withProperty("POSTGRES_USER", "container_user")
                .withProperty("POSTGRES_PASSWORD", "container_password")
                .withProperty("DB_NAME", "legacy_database")
                .withProperty("DB_USERNAME", "legacy_user")
                .withProperty("DB_PASSWORD", "legacy_password");

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://postgres:5432/container_database");
        assertThat(environment.getProperty("spring.datasource.username"))
                .isEqualTo("container_user");
        assertThat(environment.getProperty("spring.datasource.password"))
                .isEqualTo("container_password");
    }

    @Test
    void shouldKeepLegacyDatabaseVariablesAsFallback() throws IOException {
        ConfigurableEnvironment environment = applicationEnvironment()
                .withProperty("DB_NAME", "legacy_database")
                .withProperty("DB_USERNAME", "legacy_user")
                .withProperty("DB_PASSWORD", "legacy_password");

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://localhost:5432/legacy_database");
        assertThat(environment.getProperty("spring.datasource.username"))
                .isEqualTo("legacy_user");
        assertThat(environment.getProperty("spring.datasource.password"))
                .isEqualTo("legacy_password");
    }

    private MockEnvironment applicationEnvironment() throws IOException {
        MockEnvironment environment = new MockEnvironment();
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        loader.load("application", new ClassPathResource("application.yml"))
                .forEach(environment.getPropertySources()::addLast);
        return environment;
    }
}
