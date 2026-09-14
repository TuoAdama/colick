package com.coliclic.backoffice.file;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceImageTest {
    @TempDir Path tempDir;

    @Test
    void storesValidatedPngWithServerControlledExtension() {
        FileStorageService service = service();
        byte[] png = new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1};
        var file = new MockMultipartFile("file", "unsafe.exe", "image/png", png);

        assertThat(service.storeImage(file, 1024)).matches("/uploads/[a-f0-9-]+\\.png");
    }

    @Test
    void rejectsMimeTypeThatDoesNotMatchFileSignature() {
        FileStorageService service = service();
        var file = new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes());

        assertThatThrownBy(() -> service.storeImage(file, 1024)).isInstanceOf(ResponseStatusException.class);
    }

    private FileStorageService service() {
        FileStorageService service = new FileStorageService();
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        return service;
    }
}
