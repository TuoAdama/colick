package com.coliclic.backoffice.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LogsScriptTest {

    @TempDir
    Path tempDirectory;

    private Path script;
    private Path dockerArguments;

    @BeforeEach
    void prepareRelease() throws IOException {
        script = tempDirectory.resolve("logs.sh");
        Files.copy(Path.of("..", "deploy", "logs.sh"), script);
        Files.writeString(tempDirectory.resolve(".release.env"),
                "COMPOSE_PROJECT_NAME=colick-preprod\n", StandardCharsets.UTF_8);
        Files.writeString(tempDirectory.resolve("compose.yml"), "services: {}\n", StandardCharsets.UTF_8);

        Path binaryDirectory = Files.createDirectory(tempDirectory.resolve("bin"));
        Path docker = binaryDirectory.resolve("docker");
        Files.writeString(docker, """
                #!/usr/bin/env bash
                printf '%s\n' "$@" >"$DOCKER_ARGUMENTS_FILE"
                printf '%s\n' \
                  '2026-08-26T10:00:00.000+02:00 INFO  application started' \
                  '2026-08-26T10:00:01.000+02:00 ERROR request failed'
                """, StandardCharsets.UTF_8);
        docker.toFile().setExecutable(true);
        dockerArguments = tempDirectory.resolve("docker-arguments.txt");
    }

    @Test
    void defaultsToLastTwoHundredBackOfficeLines() throws Exception {
        Result result = run();

        assertThat(result.exitCode()).isZero();
        assertThat(arguments()).containsSubsequence(
                "compose", "-p", "colick-preprod", "--env-file",
                tempDirectory.resolve(".release.env").toString(), "-f",
                tempDirectory.resolve("compose.yml").toString(), "logs",
                "--no-color", "--no-log-prefix", "--tail", "200", "back-office");
    }

    @Test
    void supportsServiceFollowSinceLinesAndLevelFilters() throws Exception {
        Result result = run("front-office", "--follow", "--since", "1h", "--lines", "50", "--level", "error");

        assertThat(result.exitCode()).isZero();
        assertThat(arguments()).containsSubsequence("logs", "--no-color", "--no-log-prefix",
                "--tail", "50", "--since", "1h", "--follow", "front-office");
        assertThat(result.output()).contains("ERROR request failed").doesNotContain("INFO  application started");
    }

    @Test
    void archiveFollowReadsThePersistentBackOfficeFile() throws Exception {
        Result result = run("back-office", "--archive", "--follow", "--lines", "25");

        assertThat(result.exitCode()).isZero();
        assertThat(arguments()).containsSubsequence(
                "exec", "-T", "back-office", "tail", "-n", "25", "-F", "/app/logs/preprod.log");
    }

    @Test
    void rejectsUnknownServiceAndLevel() throws Exception {
        assertThat(run("redis").exitCode()).isEqualTo(2);
        assertThat(run("--level", "verbose").exitCode()).isEqualTo(2);
    }

    @Test
    void rejectsMissingOptionValuesAndInvalidArchiveCombination() throws Exception {
        assertThat(run("--since").exitCode()).isEqualTo(2);
        assertThat(run("--lines", "0").exitCode()).isEqualTo(2);
        assertThat(run("--level").exitCode()).isEqualTo(2);
        assertThat(run("--archive", "--since", "1h").exitCode()).isEqualTo(2);
        assertThat(run("front-office", "--archive").exitCode()).isEqualTo(2);
    }

    private Result run(String... arguments) throws Exception {
        List<String> command = new ArrayList<>();
        command.add("bash");
        command.add(script.toString());
        command.addAll(Arrays.asList(arguments));

        ProcessBuilder processBuilder = new ProcessBuilder(command).redirectErrorStream(true);
        processBuilder.environment().put("PATH",
                tempDirectory.resolve("bin") + System.getProperty("path.separator")
                        + processBuilder.environment().get("PATH"));
        processBuilder.environment().put("DOCKER_ARGUMENTS_FILE", dockerArguments.toString());
        Process process = processBuilder.start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        return new Result(process.waitFor(), output);
    }

    private List<String> arguments() throws IOException {
        return Files.readAllLines(dockerArguments, StandardCharsets.UTF_8);
    }

    private record Result(int exitCode, String output) {
    }
}
