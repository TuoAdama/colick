package com.coliclic.backoffice.file;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.nio.file.Files;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceImageTest {
    @TempDir Path tempDir;

    @ParameterizedTest
    @ValueSource(strings = {"png", "jpeg"})
    void decodesAndReencodesSupportedJdkImages(String format) throws Exception {
        var output = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(new java.awt.image.BufferedImage(2, 2,
                java.awt.image.BufferedImage.TYPE_INT_RGB), format, output);
        output.write("<html>discard trailing data</html>".getBytes());
        String url = service().storeImage(new MockMultipartFile("file", "active.svg", "image/" + format, output.toByteArray()), 1024);
        Path stored = tempDir.resolve(url.substring("/uploads/".length()));
        assertThat(javax.imageio.ImageIO.read(stored.toFile())).isNotNull();
        assertThat(Files.readString(stored, java.nio.charset.StandardCharsets.ISO_8859_1)).doesNotContain("<html>");
    }

    @Test
    void decodesWebpAndRewritesAsPng() throws Exception {
        byte[] webp = java.util.Base64.getDecoder().decode(
                "UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoCAAIAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=");
        String url = service().storeImage(new MockMultipartFile("file", "photo.webp", "image/webp", webp), 1024);
        assertThat(url).endsWith(".png");
        assertThat(javax.imageio.ImageIO.read(tempDir.resolve(url.substring("/uploads/".length())).toFile()).getWidth()).isEqualTo(2);
    }

    @Test
    void rejectsTruncatedImageEvenWithValidPngSignature() {
        byte[] header = new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1};
        assertThatThrownBy(() -> service().storeImage(new MockMultipartFile("file", "photo.png", "image/png", header), 1024))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void rejectsEmptyOversizedAndMismatchedFormats() throws Exception {
        assertThatThrownBy(() -> service().storeImage(new MockMultipartFile("file", "photo.png", null, png()), 1024))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service().storeImage(new MockMultipartFile("file", new byte[0]), 1024))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service().storeImage(new MockMultipartFile("file", "photo.png", "image/png", png()), 1))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service().storeImage(new MockMultipartFile("file", "photo.jpg", "image/jpeg", png()), 1024))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void storesValidatedPngWithServerControlledExtension() throws Exception {
        FileStorageService service = service();
        byte[] png = png();
        var file = new MockMultipartFile("file", "unsafe.exe", "image/png", png);

        assertThat(service.storeImage(file, 1024)).matches("/uploads/[a-f0-9-]+\\.png");
    }

    @Test
    void rejectsMimeTypeThatDoesNotMatchFileSignature() {
        FileStorageService service = service();
        var file = new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes());

        assertThatThrownBy(() -> service.storeImage(file, 1024)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void deletesOnlyManagedUploadedFiles() throws Exception {
        FileStorageService service = service();
        byte[] png = png();
        String url = service.storeImage(new MockMultipartFile("file", "parcel.png", "image/png", png), 1024);
        Path path = tempDir.resolve(url.substring("/uploads/".length()));
        assertThat(path).exists();

        service.deleteManagedUpload("https://example.com/parcel.png");
        assertThat(path).exists();
        service.deleteManagedUpload("/uploads/../parcel.png");
        assertThat(path).exists();
        service.deleteManagedUpload(url);
        assertThat(Files.exists(path)).isFalse();
    }

    private byte[] png() throws Exception {
        var output = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(new java.awt.image.BufferedImage(2, 2,
                java.awt.image.BufferedImage.TYPE_INT_RGB), "png", output);
        return output.toByteArray();
    }

    private FileStorageService service() {
        FileStorageService service = new FileStorageService();
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        return service;
    }
}
