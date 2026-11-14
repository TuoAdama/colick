package com.coliclic.backoffice.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

class DeploymentIndexabilityConfigurationTest {

    @Test
    void preprodRouters_shouldAddNoindexHeaderToFrontAndApiResponses() throws IOException {
        String compose = Files.readString(Path.of("..", "deploy", "compose.preprod.yml"));

        assertThat(compose)
                .contains("traefik.http.middlewares.colick-preprod-noindex.headers.customresponseheaders.X-Robots-Tag: \"noindex\"")
                .containsPattern("traefik\\.http\\.routers\\.colick-preprod-front-office\\.middlewares: \"[^\"\\n]*\\bcolick-preprod-noindex@docker(?:,|\")")
                .containsPattern("traefik\\.http\\.routers\\.colick-preprod-back-office\\.middlewares: \"[^\"\\n]*\\bcolick-preprod-noindex@docker(?:,|\")")
                .contains("traefik.http.routers.colick-preprod-front-office.rule: \"Host(`preprod.coliclic.com`)\"")
                .contains("traefik.http.routers.colick-preprod-back-office.rule: \"Host(`preprod.coliclic.com`) && PathPrefix(`/api`)\"");
    }

    @Test
    void productionRouters_shouldNotAddNoindexHeader() throws IOException {
        String compose = Files.readString(Path.of("..", "deploy", "compose.production.yml"));

        assertThat(compose)
                .doesNotContain("X-Robots-Tag")
                .doesNotContain("colick-preprod-noindex")
                .contains("traefik.http.routers.colick-production-front-office.rule: \"Host(`coliclic.com`)\"");
    }

    @Test
    void robotsEndpoint_shouldAllowCrawlersToReadNoindexHeaders() throws IOException {
        String server = Files.readString(Path.of("..", "front-office", "src", "server.ts"));

        assertThat(server)
                .contains("app.get('/robots.txt'")
                .contains(".type('text/plain').send('User-agent: *\\nAllow: /\\n')");
    }

    @Test
    void productionSeed_shouldNotLoadFixtureTrips() throws IOException {
        String seed = Files.readString(Path.of("src", "main", "resources", "data.sql"));
        String productionCompose = Files.readString(Path.of("..", "deploy", "compose.production.yml"));

        assertThat(seed).doesNotContain("FIXTURE").contains("INSERT INTO locations");
        assertThat(Pattern.compile("(?i)INSERT\\s+INTO\\s+trips").matcher(seed).find()).isFalse();
        assertThat(productionCompose).doesNotContain("SPRING_PROFILES_ACTIVE: fixture");
    }
}
