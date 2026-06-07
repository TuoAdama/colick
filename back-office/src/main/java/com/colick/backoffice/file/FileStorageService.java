package com.colick.backoffice.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

/**
 * Service responsible for persisting uploaded files to the local filesystem
 * and returning a public-facing URL path.
 */
@Service
public class FileStorageService {

    private static final String PUBLIC_UPLOAD_PREFIX = "/uploads/";
    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    /**
     * Stores a multipart file under the configured upload directory and returns
     * the URL path that can be used to retrieve it (e.g. {@code /uploads/uuid.jpg}).
     *
     * @param file the uploaded file
     * @return the relative URL path to the stored file
     * @throws RuntimeException if an I/O error occurs during storage
     */
    public String store(MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);

            // Preserve the original file extension when present
            String ext = "";
            String original = file.getOriginalFilename();
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf("."));
            }

            String filename = UUID.randomUUID() + ext;
            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return PUBLIC_UPLOAD_PREFIX + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    /**
     * Returns the given public upload URL only when it points to an existing
     * local file. Unknown or external URLs are returned as-is.
     */
    public String sanitizePublicUrl(String publicUrl) {
        String sanitizedUrl = publicUrl == null ? null : publicUrl.trim();
        if (sanitizedUrl == null || sanitizedUrl.isBlank()) {
            return null;
        }

        if (!isManagedUploadUrl(sanitizedUrl)) {
            return sanitizedUrl;
        }

        Path filePath = resolveManagedUploadPath(sanitizedUrl);
        return filePath != null && Files.isRegularFile(filePath)
                ? toPublicUploadUrl(filePath.getFileName().toString())
                : null;
    }

    private boolean isManagedUploadUrl(String publicUrl) {
        return publicUrl.startsWith(PUBLIC_UPLOAD_PREFIX) || publicUrl.startsWith("uploads/");
    }

    private Path resolveManagedUploadPath(String publicUrl) {
        String relativePath = publicUrl.startsWith(PUBLIC_UPLOAD_PREFIX)
                ? publicUrl.substring(PUBLIC_UPLOAD_PREFIX.length())
                : publicUrl.substring("uploads/".length());
        if (relativePath.isBlank()) {
            return null;
        }

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path resolvedPath = uploadPath.resolve(relativePath).normalize();
        if (!resolvedPath.startsWith(uploadPath)) {
            return null;
        }

        return resolvedPath;
    }

    private String toPublicUploadUrl(String filename) {
        return PUBLIC_UPLOAD_PREFIX + filename;
    }
}
