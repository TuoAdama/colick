package com.coliclic.motion;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** JUnit entry point for unit, image, audio and final MP4 functional gates. */
@Timeout(value = 120, unit = TimeUnit.SECONDS)
class FilmTest {
    private void runChecks(String suite) throws Exception {
        var process = new ProcessBuilder(
                System.getProperty("motion.python"), "-m", "unittest", "-v", "test_render." + suite)
                .directory(Path.of(System.getProperty("motion.root")).toFile())
                .redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.PIPE)
                .start();
        try {
            assertTrue(process.waitFor(100, TimeUnit.SECONDS), "Film verification timed out: " + suite);
            var output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            System.out.print(output);
            assertEquals(0, process.exitValue(), output);
        } finally {
            process.destroyForcibly();
        }
    }

    @Test void timingProductFidelityAndParcelContinuity() throws Exception { runChecks("TimelineTests"); }
    @Test void renderedFramesAndMobileMargins() throws Exception { runChecks("FrameTests"); }
    @Test void musicFoleyAndSynchronization() throws Exception { runChecks("AudioTests"); }
    @Test void finalEncodedMaster() throws Exception { runChecks("ExportTests"); }
}
