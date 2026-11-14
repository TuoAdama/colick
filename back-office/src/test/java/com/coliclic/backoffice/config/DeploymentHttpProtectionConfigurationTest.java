package com.coliclic.backoffice.config;

import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DeploymentHttpProtectionConfigurationTest {

    private static final String FRONT_ROUTER = "traefik.http.routers.colick-preprod-front-office.";
    private static final String BACK_ROUTER = "traefik.http.routers.colick-preprod-back-office.";
    private static final String HTTP_ROUTER = "traefik.http.routers.colick-preprod-http.";
    private static final String REDIRECT = "traefik.http.middlewares.colick-preprod-redirect-https.redirectscheme.";
    private static final String HSTS = "traefik.http.middlewares.colick-preprod-hsts.headers.customresponseheaders.Strict-Transport-Security";
    private static final String PREPROD_HOST = "Host(`preprod.coliclic.com`)";

    @Test
    void preprodRedirectShouldMatchOnlyThePreprodHostOnHttp() throws IOException {
        Map<String, Object> labels = labels(services("preprod"), "front-office");

        assertThat(labels)
                .containsEntry(HTTP_ROUTER + "rule", PREPROD_HOST)
                .containsEntry(HTTP_ROUTER + "entrypoints", "web")
                .containsEntry(HTTP_ROUTER + "service", "noop@internal")
                .containsEntry(HTTP_ROUTER + "middlewares", "colick-preprod-redirect-https@docker")
                .containsEntry(REDIRECT + "scheme", "https")
                .containsEntry(REDIRECT + "permanent", "true");
    }

    @Test
    void preprodHttpsRoutersShouldReplaceHstsAndRetainNoindex() throws IOException {
        Map<String, Object> services = services("preprod");
        String middlewares = "colick-preprod-hsts@docker,colick-preprod-noindex@docker";

        assertThat(labels(services, "front-office"))
                .containsEntry(FRONT_ROUTER + "rule", PREPROD_HOST)
                .containsEntry(FRONT_ROUTER + "entrypoints", "websecure")
                .containsEntry(FRONT_ROUTER + "middlewares", middlewares);
        assertThat(labels(services, "back-office"))
                .containsEntry(BACK_ROUTER + "rule", PREPROD_HOST + " && PathPrefix(`/api`)")
                .containsEntry(BACK_ROUTER + "entrypoints", "websecure")
                .containsEntry(BACK_ROUTER + "middlewares", middlewares)
                .containsEntry(HSTS, "max-age=86400");
    }

    @Test
    void onlyPreprodFrontOfficeShouldReceiveTheReportOnlyPolicy() throws IOException {
        Map<String, Object> preprod = services("preprod");
        Map<String, Object> production = services("production");

        assertThat(environment(preprod, "front-office").get("SSR_CSP_REPORT_ONLY"))
                .isInstanceOfSatisfying(String.class, policy -> assertThat(policy)
                        .contains("script-src 'self' https://accounts.google.com/gsi/client;", "media-src 'self';")
                        .doesNotContain("unsafe-eval"));
        assertThat(environment(preprod, "back-office")).doesNotContainKey("SSR_CSP_REPORT_ONLY");
        assertThat(environment(production, "front-office")).doesNotContainKey("SSR_CSP_REPORT_ONLY");
        for (String service : new String[]{"front-office", "back-office"}) {
            assertThat(labels(production, service).toString()).doesNotContain("colick-preprod-");
        }
    }

    private Map<String, Object> services(String target) throws IOException {
        Map<String, Object> compose = new Yaml().load(Files.readString(Path.of("..", "deploy", "compose." + target + ".yml")));
        return mapping(compose, "services");
    }

    private Map<String, Object> labels(Map<String, Object> services, String service) {
        return mapping(mapping(services, service), "labels");
    }

    private Map<String, Object> environment(Map<String, Object> services, String service) {
        return mapping(mapping(services, service), "environment");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> mapping(Map<String, Object> source, String key) {
        return (Map<String, Object>) source.get(key);
    }
}
