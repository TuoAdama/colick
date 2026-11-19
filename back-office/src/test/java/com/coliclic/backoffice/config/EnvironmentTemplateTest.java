package com.coliclic.backoffice.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EnvironmentTemplateTest {

    private static final Path ROOT = Path.of("..");
    private static final Pattern DECLARATION = Pattern.compile("([A-Z][A-Z0-9_]*)(=.*)?");
    private static final Pattern SPRING_VARIABLE = Pattern.compile("\\$\\{([A-Z][A-Z0-9_]*)(?=[:}])");
    private static final Pattern LOG_VARIABLE = Pattern.compile("source=\"([A-Z][A-Z0-9_]*)\"");
    private static final Pattern NODE_VARIABLE = Pattern.compile("process\\.env\\['([A-Z][A-Z0-9_]*)'\\]");
    private static final Set<String> DEPLOYMENT_SETTINGS_WITHOUT_VALUES = Set.of(
            "POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD", "DB_NAME", "DB_USERNAME", "DB_PASSWORD",
            "REDIS_PASSWORD", "JWT_SECRET", "MAIL_HOST", "MAIL_PORT", "MAIL_USERNAME", "MAIL_PASSWORD",
            "MAIL_SMTP_AUTH", "MAIL_SMTP_STARTTLS_ENABLE", "MAIL_FROM_ADDRESS", "MAIL_SUPPORT_EMAIL",
            "GOOGLE_CLIENT_ID", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER",
            "GA_MEASUREMENT_ID"
    );

    @ParameterizedTest
    @ValueSource(strings = {".env.example", ".env.preprod.example", ".env.prod.example"})
    void templateDeclaresEachApplicationVariableOnce(String filename) throws IOException {
        Set<String> keys = new LinkedHashSet<>();
        for (String declaration : declarations(filename)) {
            var match = DECLARATION.matcher(declaration);
            assertTrue(match.matches(), () -> filename + " has an invalid declaration");
            assertThat(keys.add(match.group(1)))
                    .as("%s declares %s more than once", filename, match.group(1))
                    .isTrue();
        }

        Set<String> expected = new LinkedHashSet<>(Set.of("NODE_ENV", "CHOKIDAR_USEPOLLING", "SPRING_PROFILES_ACTIVE"));
        expected.addAll(variableNames("back-office/src/main/resources/application.yml", SPRING_VARIABLE));
        expected.addAll(variableNames("back-office/src/main/resources/logback-spring.xml", LOG_VARIABLE));
        expected.addAll(variableNames("front-office/src/server.ts", NODE_VARIABLE));
        expected.addAll(variableNames("front-office/src/app/app.config.server.ts", NODE_VARIABLE));
        assertThat(keys).as("%s application variables", filename).containsAll(expected);
    }

    @ParameterizedTest
    @ValueSource(strings = {".env.preprod.example", ".env.prod.example"})
    void deploymentSettingsAreDeclaredWithoutValues(String filename) throws IOException {
        Set<String> withoutValues = declarations(filename).stream()
                .filter(line -> !line.contains("="))
                .collect(Collectors.toSet());
        assertThat(withoutValues).as("%s declarations without values", filename)
                .containsAll(DEPLOYMENT_SETTINGS_WITHOUT_VALUES);
    }

    private static List<String> declarations(String filename) throws IOException {
        return Files.readAllLines(ROOT.resolve(filename)).stream()
                .map(String::strip)
                .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                .toList();
    }

    private static Set<String> variableNames(String source, Pattern pattern) throws IOException {
        return pattern.matcher(Files.readString(ROOT.resolve(source))).results()
                .map(match -> match.group(1))
                .collect(Collectors.toSet());
    }
}
