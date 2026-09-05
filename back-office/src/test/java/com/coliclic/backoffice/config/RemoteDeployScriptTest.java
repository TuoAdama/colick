package com.coliclic.backoffice.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RemoteDeployScriptTest {

    @TempDir
    Path tempDirectory;

    private Path binaryDirectory;
    private Path script;

    @BeforeEach
    void prepareCommands() throws IOException {
        script = Path.of("..", "deploy", "remote-deploy.sh").toAbsolutePath().normalize();
        binaryDirectory = Files.createDirectory(tempDirectory.resolve("bin"));

        writeExecutable("docker", """
                #!/usr/bin/env bash
                arguments=$(printf ' %s' "$@")
                if [[ "$arguments" == *" pull"* && "${FAIL_PULL:-false}" == "true" ]]; then
                  exit 1
                fi
                if [[ "$arguments" == *" up "* && -n "${FAIL_UP_ENV_FILE:-}" \
                     && "$arguments" == *"$FAIL_UP_ENV_FILE"* ]]; then
                  exit 1
                fi
                if [[ "$arguments" == *" logs "* ]]; then
                  echo "simulated deployment failure"
                fi
                exit 0
                """);
        writeExecutable("curl", """
                #!/usr/bin/env bash
                exit 0
                """);
        writeExecutable("readlink", """
                #!/usr/bin/env bash
                if [[ "${1:-}" == "-f" ]]; then
                  shift
                  exec /bin/realpath "$@"
                fi
                exec /usr/bin/readlink "$@"
                """);
        writeExecutable("mv", """
                #!/usr/bin/env bash
                if [[ "${1:-}" == "-Tf" ]]; then
                  /bin/rm -f "$3"
                  exec /bin/mv "$2" "$3"
                fi
                exec /bin/mv "$@"
                """);
        writeExecutable("rm", """
                #!/usr/bin/env bash
                if [[ -n "${REMOVE_FAILURE_PATH:-}" ]]; then
                  for argument in "$@"; do
                    if [[ "$argument" == "$REMOVE_FAILURE_PATH" ]]; then
                      exit 1
                    fi
                  done
                fi
                exec /bin/rm "$@"
                """);
    }

    @Test
    void keepsAtMostThreeSuccessfulReleasesAndLeavesOtherEnvironmentUntouched() throws Exception {
        Path preprod = environment("preprod");
        Path production = environment("production");
        Path oldCurrent = release(preprod, "old-current", true, 1);
        Path old = release(preprod, "old", true, 2);
        Path recent = release(preprod, "recent", true, 3);
        Path newest = release(preprod, "newest", true, 4);
        Path failed = release(preprod, "failed", false, 5);
        Path deployed = release(preprod, "deployed", true, 6);
        Path productionRelease = release(production, "production-release", true, 1);
        Files.delete(oldCurrent.resolve(".deployment-success"));
        Files.setLastModifiedTime(oldCurrent, FileTime.fromMillis(1_000));
        Path current = currentLink(preprod, oldCurrent);

        Result result = run(deployed, current, Map.of());

        assertThat(result.exitCode()).isZero();
        assertThat(Files.readSymbolicLink(current)).isEqualTo(deployed);
        assertThat(Files.exists(oldCurrent)).isFalse();
        assertThat(Files.exists(old)).isFalse();
        assertThat(Files.exists(recent)).isTrue();
        assertThat(Files.exists(newest)).isTrue();
        assertThat(Files.exists(deployed.resolve(".deployment-success"))).isTrue();
        assertThat(Files.exists(failed)).isTrue();
        assertThat(Files.exists(productionRelease)).isTrue();
    }

    @Test
    void doesNotDeleteAnythingWhenOnlyThreeSuccessfulReleasesExist() throws Exception {
        Path environment = environment("preprod");
        Path first = release(environment, "first", true, 1);
        Path second = release(environment, "second", true, 2);
        Path deployed = release(environment, "deployed", true, 3);
        Path current = currentLink(environment, first);

        Result result = run(deployed, current, Map.of());

        assertThat(result.exitCode()).isZero();
        assertThat(List.of(first, second, deployed)).allMatch(Files::exists);
    }

    @Test
    void protectsCurrentReleaseAndPrunesAfterRollback() throws Exception {
        Path environment = environment("preprod");
        Path currentRelease = release(environment, "current-oldest", true, 1);
        Path old = release(environment, "old", true, 2);
        Path recent = release(environment, "recent", true, 3);
        Path newest = release(environment, "newest", true, 4);
        Path failedDeployment = release(environment, "failed-deployment", true, 5);
        Path current = currentLink(environment, currentRelease);

        Result result = run(failedDeployment, current,
                Map.of("FAIL_UP_ENV_FILE", failedDeployment.resolve(".release.env").toString()));

        assertThat(result.exitCode()).isEqualTo(1);
        assertThat(result.output()).contains("Rollback succeeded");
        assertThat(Files.readSymbolicLink(current)).isEqualTo(currentRelease);
        assertThat(Files.exists(currentRelease)).isTrue();
        assertThat(Files.exists(old)).isFalse();
        assertThat(Files.exists(recent)).isTrue();
        assertThat(Files.exists(newest)).isTrue();
        assertThat(Files.exists(failedDeployment.resolve("deployment.log"))).isTrue();
        assertThat(Files.exists(failedDeployment.resolve(".deployment-success"))).isFalse();
    }

    @Test
    void reclassifiesSameShaWhenRetrySucceeds() throws Exception {
        Path environment = environment("preprod");
        Path currentRelease = release(environment, "current", true, 1);
        Path retriedRelease = release(environment, "same-sha", false, 2);
        Path current = currentLink(environment, currentRelease);

        Result result = run(retriedRelease, current, Map.of());

        assertThat(result.exitCode()).isZero();
        assertThat(Files.exists(retriedRelease.resolve("deployment.log"))).isFalse();
        assertThat(Files.exists(retriedRelease.resolve(".deployment-success"))).isTrue();
        assertThat(Files.readSymbolicLink(current)).isEqualTo(retriedRelease);
    }

    @Test
    void marksPullFailureAndPrunesWithoutStartingRollback() throws Exception {
        Path environment = environment("preprod");
        Path currentRelease = release(environment, "current-oldest", true, 1);
        Path old = release(environment, "old", true, 2);
        Path recent = release(environment, "recent", true, 3);
        Path newest = release(environment, "newest", true, 4);
        Path failedDeployment = release(environment, "pull-failure", true, 5);
        Path current = currentLink(environment, currentRelease);

        Result result = run(failedDeployment, current, Map.of("FAIL_PULL", "true"));

        assertThat(result.exitCode()).isEqualTo(1);
        assertThat(result.output()).contains("Image pull failed").doesNotContain("Rolling back");
        assertThat(Files.exists(currentRelease)).isTrue();
        assertThat(Files.exists(old)).isFalse();
        assertThat(Files.exists(recent)).isTrue();
        assertThat(Files.exists(newest)).isTrue();
        assertThat(Files.readString(failedDeployment.resolve("deployment.log")))
                .contains("Image pull failed");
        assertThat(Files.exists(failedDeployment.resolve(".deployment-success"))).isFalse();
    }

    @Test
    void handlesFirstFailedDeploymentWithoutCurrentOrSuccessfulRelease() throws Exception {
        Path environment = environment("preprod");
        Path failedDeployment = release(environment, "first-release", true, 1);
        Path current = environment.resolve("current").toAbsolutePath();

        Result result = run(failedDeployment, current, Map.of("FAIL_PULL", "true"));

        assertThat(result.exitCode()).isEqualTo(1);
        assertThat(result.output()).contains("Image pull failed").doesNotContain("unbound variable");
        assertThat(Files.exists(failedDeployment.resolve("deployment.log"))).isTrue();
        assertThat(Files.exists(failedDeployment.resolve(".deployment-success"))).isFalse();
        assertThat(Files.exists(current)).isFalse();
    }

    @Test
    void protectsCanonicalCurrentWhenDeployRootUsesSymlinkedAncestor() throws Exception {
        Path physicalRoot = Files.createDirectory(tempDirectory.resolve("physical-root"));
        Path aliasedRoot = tempDirectory.resolve("aliased-root");
        Files.createSymbolicLink(aliasedRoot, physicalRoot);
        Path environment = aliasedRoot.resolve("colick").resolve("preprod");
        Files.createDirectories(environment.resolve("releases"));
        Path currentRelease = release(environment, "current-oldest", true, 1);
        Path old = release(environment, "old", true, 2);
        Path recent = release(environment, "recent", true, 3);
        Path newest = release(environment, "newest", true, 4);
        Path failedDeployment = release(environment, "pull-failure", true, 5);
        Path current = currentLink(environment, currentRelease);

        Result result = run(failedDeployment, current, Map.of("FAIL_PULL", "true"));

        assertThat(result.exitCode()).isEqualTo(1);
        assertThat(Files.exists(currentRelease)).isTrue();
        assertThat(Files.readSymbolicLink(current)).isEqualTo(currentRelease);
        assertThat(Files.exists(old)).isFalse();
        assertThat(Files.exists(recent)).isTrue();
        assertThat(Files.exists(newest)).isTrue();
        assertThat(Files.exists(failedDeployment.resolve("deployment.log"))).isTrue();
    }

    @Test
    void reportsCleanupFailureWithoutFailingHealthyDeployment() throws Exception {
        Path environment = environment("preprod");
        Path removalFailure = release(environment, "removal-failure", true, 1);
        Path firstKept = release(environment, "first-kept", true, 2);
        Path secondKept = release(environment, "second-kept", true, 3);
        Path deployed = release(environment, "deployed", true, 4);
        Path current = currentLink(environment, firstKept);
        String canonicalRemovalFailure = removalFailure.toRealPath().toString();

        Result result = run(deployed, current,
                Map.of("REMOVE_FAILURE_PATH", canonicalRemovalFailure));

        assertThat(result.exitCode()).isZero();
        assertThat(result.output()).contains(
                "Failed to remove old successful release: " + canonicalRemovalFailure,
                "Warning: release retention cleanup did not complete");
        assertThat(Files.exists(removalFailure)).isTrue();
        assertThat(Files.readSymbolicLink(current)).isEqualTo(deployed);
    }

    private Path environment(String name) throws IOException {
        Path environment = tempDirectory.resolve("colick").resolve(name);
        Files.createDirectories(environment.resolve("releases"));
        return environment;
    }

    private Path release(Path environment, String name, boolean successful, long order) throws IOException {
        Path release = Files.createDirectory(environment.resolve("releases").resolve(name));
        Files.writeString(release.resolve(".runtime.env"), "RUNTIME=true\n", StandardCharsets.UTF_8);
        Files.writeString(release.resolve(".release.env"),
                "COMPOSE_PROJECT_NAME=colick-test\n", StandardCharsets.UTF_8);
        Files.writeString(release.resolve("compose.yml"), "services: {}\n", StandardCharsets.UTF_8);
        if (successful) {
            Files.writeString(release.resolve(".deployment-success"), "", StandardCharsets.UTF_8);
        } else {
            Files.writeString(release.resolve("deployment.log"), "previous failure\n", StandardCharsets.UTF_8);
        }
        Files.setLastModifiedTime(release, FileTime.fromMillis(order * 1_000));
        return release.toAbsolutePath();
    }

    private Path currentLink(Path environment, Path target) throws IOException {
        Path current = environment.resolve("current").toAbsolutePath();
        Files.createSymbolicLink(current, target);
        return current;
    }

    private Result run(Path release, Path current, Map<String, String> environment) throws Exception {
        ProcessBuilder processBuilder = new ProcessBuilder(
                "bash", script.toString(), release.toString(), current.toString(),
                "colick-test", "github-user", "https://example.test/health")
                .redirectErrorStream(true);
        processBuilder.environment().put("PATH",
                binaryDirectory + System.getProperty("path.separator") + processBuilder.environment().get("PATH"));
        processBuilder.environment().putAll(environment);

        Process process = processBuilder.start();
        process.getOutputStream().write("token\n".getBytes(StandardCharsets.UTF_8));
        process.getOutputStream().close();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        return new Result(process.waitFor(), output);
    }

    private void writeExecutable(String name, String content) throws IOException {
        Path command = binaryDirectory.resolve(name);
        Files.writeString(command, content, StandardCharsets.UTF_8);
        command.toFile().setExecutable(true);
    }

    private record Result(int exitCode, String output) {
    }
}
