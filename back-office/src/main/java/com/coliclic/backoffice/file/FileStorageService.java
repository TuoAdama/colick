package com.coliclic.backoffice.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Service responsible for persisting uploaded files to the local filesystem
 * and returning a public-facing URL path.
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final String PUBLIC_UPLOAD_PREFIX = "/uploads/";
    private static final Pattern MANAGED_IMAGE_FILENAME = Pattern.compile(
            "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(jpg|png|webp)");
    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    private static final Map<String, String> IMAGE_EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    /** Stores a validated image without trusting its client-provided filename. */
    public String storeImage(MultipartFile file, long maxBytes) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La photo est vide.");
        }
        if (file.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La photo dépasse la taille maximale autorisée.");
        }
        String extension = IMAGE_EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La photo doit être au format JPEG, PNG ou WebP.");
        }
        if (!hasExpectedImageSignature(file, file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le contenu du fichier ne correspond pas à un format d’image autorisé.");
        }
        return storeWithExtension(file, extension);
    }

    private boolean hasExpectedImageSignature(MultipartFile file, String contentType) {
        try {
            byte[] header = file.getInputStream().readNBytes(12);
            return switch (contentType) {
                case "image/jpeg" -> header.length >= 3
                        && (header[0] & 0xff) == 0xff && (header[1] & 0xff) == 0xd8 && (header[2] & 0xff) == 0xff;
                case "image/png" -> header.length >= 8
                        && (header[0] & 0xff) == 0x89 && header[1] == 0x50 && header[2] == 0x4e
                        && header[3] == 0x47 && header[4] == 0x0d && header[5] == 0x0a
                        && header[6] == 0x1a && header[7] == 0x0a;
                case "image/webp" -> header.length >= 12
                        && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                        && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
                default -> false;
            };
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible de lire la photo.", ex);
        }
    }

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

    private String storeWithExtension(MultipartFile file, String extension) {
        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path target = dir.resolve(UUID.randomUUID() + extension);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return PUBLIC_UPLOAD_PREFIX + target.getFileName();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    /** Deletes only a single file under the managed upload directory, never an external URL. */
    public void deleteManagedUpload(String publicUrl) {
        if (publicUrl == null || !isManagedUploadUrl(publicUrl)) return;
        Path path = resolveManagedUploadPath(publicUrl);
        Path directory = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (path == null || !directory.equals(path.getParent())
                || !MANAGED_IMAGE_FILENAME.matcher(path.getFileName().toString()).matches()) return;
        try {
            Files.deleteIfExists(path);
        } catch (IOException ex) {
            log.warn("Could not delete superseded managed upload {}", path.getFileName(), ex);
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
