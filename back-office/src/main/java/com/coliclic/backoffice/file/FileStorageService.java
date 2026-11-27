package com.coliclic.backoffice.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Persists uploaded images on the local filesystem.
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final String PUBLIC_UPLOAD_PREFIX = "/uploads/";
    private static final String BOOKING_PHOTO_DIRECTORY = "booking-photos";
    private static final String BOOKING_PHOTO_PREFIX = BOOKING_PHOTO_DIRECTORY + "/";
    private static final List<String> LEGACY_UPLOAD_PREFIXES = List.of(PUBLIC_UPLOAD_PREFIX, "uploads/", "/api/uploads/", "api/uploads/");
    private static final Pattern MANAGED_IMAGE_FILENAME = Pattern.compile(
            "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(?i:jpg|jpeg|png|webp)");
    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    private static final Set<String> IMAGE_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    /** Stores a validated image without trusting its client-provided filename. */
    public String storeImage(MultipartFile file, long maxBytes) {
        return storeImage(file, maxBytes, uploadDirectory(), PUBLIC_UPLOAD_PREFIX);
    }

    public String storeBookingPhoto(MultipartFile file, long maxBytes) {
        return storeImage(file, maxBytes, bookingPhotoDirectory(), BOOKING_PHOTO_PREFIX);
    }

    private String storeImage(MultipartFile file, long maxBytes, Path directory, String prefix) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La photo est vide.");
        }
        if (file.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La photo dépasse la taille maximale autorisée.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !IMAGE_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La photo doit être au format JPEG, PNG ou WebP.");
        }
        return storeDecodedImage(file, contentType.substring("image/".length()), directory, prefix);
    }

    private String storeDecodedImage(MultipartFile file, String expectedFormat, Path directory, String prefix) {
        BufferedImage image;
        try (var input = new MemoryCacheImageInputStream(file.getInputStream())) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalidImage();
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                if (!reader.getFormatName().equalsIgnoreCase(expectedFormat)) throw invalidImage();
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > 20_000_000L) {
                    throw invalidImage();
                }
                image = reader.read(0);
                if (image == null) throw invalidImage();
            } finally {
                reader.dispose();
            }
        } catch (IOException | IllegalArgumentException ex) {
            throw invalidImage();
        }

        // Re-encoding discards metadata, trailing HTML and other client-supplied bytes.
        String outputFormat = expectedFormat.equals("jpeg") ? "jpeg" : "png";
        String extension = outputFormat.equals("jpeg") ? ".jpg" : ".png";
        Path target = null;
        try {
            Files.createDirectories(directory);
            target = directory.resolve(UUID.randomUUID() + extension);
            if (!ImageIO.write(image, outputFormat, target.toFile())) {
                throw new IOException("No image writer for " + outputFormat);
            }
            return prefix + target.getFileName();
        } catch (IOException ex) {
            if (target != null) {
                try { Files.deleteIfExists(target); } catch (IOException cleanup) { ex.addSuppressed(cleanup); }
            }
            throw new IllegalStateException("Failed to store image", ex);
        }
    }

    private ResponseStatusException invalidImage() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Le contenu du fichier ne correspond pas à un format d’image autorisé.");
    }

    /** Deletes only a single file under the managed upload directory, never an external URL. */
    public void deleteManagedUpload(String publicUrl) {
        if (publicUrl == null || !isManagedUploadUrl(publicUrl)) return;
        Path path = resolveManagedUploadPath(publicUrl);
        Path directory = uploadDirectory();
        if (path == null || !directory.equals(path.getParent())
                || !MANAGED_IMAGE_FILENAME.matcher(path.getFileName().toString()).matches()) return;
        deleteFile(path);
    }

    /** Moves a historical photo before its database reference can be replaced. */
    public void privatizeLegacyBookingPhoto(String reference) {
        String filename = bookingPhotoFilename(reference);
        if (filename == null || reference.trim().startsWith(BOOKING_PHOTO_PREFIX)) return;
        Path legacy = uploadDirectory().resolve(filename);
        if (!Files.isRegularFile(legacy, LinkOption.NOFOLLOW_LINKS)) return;

        Path directory = bookingPhotoDirectory();
        try {
            Files.createDirectories(directory);
            Files.move(legacy, directory.resolve(filename));
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to protect historical booking photo", ex);
        }
    }

    public Path findBookingPhoto(String reference) {
        String filename = bookingPhotoFilename(reference);
        if (filename == null) return null;
        Path privatePhoto = bookingPhotoDirectory().resolve(filename);
        if (Files.isRegularFile(privatePhoto, LinkOption.NOFOLLOW_LINKS)) return privatePhoto;
        if (reference.trim().startsWith(BOOKING_PHOTO_PREFIX)) return null;
        Path legacyPhoto = uploadDirectory().resolve(filename);
        return Files.isRegularFile(legacyPhoto, LinkOption.NOFOLLOW_LINKS) ? legacyPhoto : null;
    }

    public void deleteBookingPhoto(String reference) {
        String filename = bookingPhotoFilename(reference);
        if (filename != null) deleteFile(bookingPhotoDirectory().resolve(filename));
    }

    public static boolean isManagedImageFilename(String filename) {
        return MANAGED_IMAGE_FILENAME.matcher(filename).matches();
    }

    public static List<String> legacyUploadReferences(String filename) {
        return LEGACY_UPLOAD_PREFIXES.stream().map(prefix -> prefix + filename).toList();
    }

    private String bookingPhotoFilename(String reference) {
        if (reference == null) return null;
        String value = reference.trim();
        String filename = value.substring(value.lastIndexOf('/') + 1);
        return isManagedImageFilename(filename) && (value.equals(BOOKING_PHOTO_PREFIX + filename)
                || legacyUploadReferences(filename).contains(value)) ? filename : null;
    }

    private Path uploadDirectory() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    private Path bookingPhotoDirectory() {
        Path directory = uploadDirectory().resolve(BOOKING_PHOTO_DIRECTORY);
        if (Files.isSymbolicLink(directory)) {
            throw new IllegalStateException("Booking photo directory must not be a symbolic link");
        }
        return directory;
    }

    private void deleteFile(Path path) {
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

        Path uploadPath = uploadDirectory();
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
