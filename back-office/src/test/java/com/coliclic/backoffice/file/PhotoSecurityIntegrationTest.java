package com.coliclic.backoffice.file;

import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.parcelrequest.repository.ParcelRequestRepository;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PhotoSecurityIntegrationTest {
    private static final Path UPLOADS = createUploadsDirectory();
    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) { registry.add("upload.dir", UPLOADS::toString); }
    @Autowired MockMvc mvc;
    @Autowired JwtUtil jwt;
    @Autowired UserRepository users;
    @Autowired TripRepository trips;
    @Autowired TripBookingRepository bookings;
    @Autowired ParcelRequestRepository parcels;
    @Autowired com.fasterxml.jackson.databind.ObjectMapper json;

    @ParameterizedTest
    @CsvSource({"active.html,text/html", "active.svg,image/svg+xml", "fake.png,image/png", "fake.jpg,image/jpeg", "fake.webp,image/webp"})
    void allPhotoEndpointsRejectActiveAndDisguisedDocuments(String filename, String mime) throws Exception {
        User owner = account();
        for (String path : photoPaths(owner)) {
            mvc.perform(multipart("/api" + path)
                            .file(new MockMultipartFile("file", filename, mime, "<html>inert document</html>".getBytes()))
                            .contextPath("/api").servletPath(path).cookie(cookie(owner)).with(csrf()))
                    .andExpect(status().isBadRequest());
        }
        try (var files = Files.list(UPLOADS)) { assertThat(files.toList()).isEmpty(); }
    }

    @Test
    void allPhotoEndpointsRewriteRealImagesAndPublicServingAddsSecurityHeaders() throws Exception {
        User owner = account();
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", output);
        output.write("<html>discard this trailing document</html>".getBytes());
        for (String path : photoPaths(owner)) {
            String response = mvc.perform(multipart("/api" + path)
                            .file(new MockMultipartFile("file", "untrusted.html", "image/png", output.toByteArray()))
                            .contextPath("/api").servletPath(path).cookie(cookie(owner)).with(csrf()))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            var node = json.readTree(response);
            String url = node.hasNonNull("photoUrl") ? node.get("photoUrl").asText() : node.get("packagePhotoUrl").asText();
            Path stored = UPLOADS.resolve(url.substring("/uploads/".length()));
            try {
                assertThat(new String(Files.readAllBytes(stored), java.nio.charset.StandardCharsets.ISO_8859_1))
                        .doesNotContain("<html>");
                mvc.perform(get("/api" + url).contextPath("/api").servletPath(url))
                        .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                        .andExpect(header().string("Content-Security-Policy", "default-src 'none'; sandbox"));
            } finally { Files.deleteIfExists(stored); }
        }
    }

    @ParameterizedTest
    @CsvSource({"html", "svg"})
    void previouslyUploadedActiveDocumentsAreNoLongerPublic(String extension) throws Exception {
        String filename = UUID.randomUUID() + "." + extension;
        Path oldFile = UPLOADS.resolve(filename);
        Files.writeString(oldFile, "<html>legacy document</html>");
        try {
            String path = "/uploads/" + filename;
            mvc.perform(get("/api" + path).contextPath("/api").servletPath(path)).andExpect(status().isNotFound());
        } finally { Files.deleteIfExists(oldFile); }
    }

    private String[] photoPaths(User owner) {
        User traveler = account();
        Trip trip = trips.saveAndFlush(Trip.builder().reference("PHOTO-" + UUID.randomUUID().toString().substring(0, 8))
                .traveler(traveler).departureAddress("Paris").destination("Abidjan")
                .departureTime(LocalDateTime.now().plusDays(1)).arrivalTime(LocalDateTime.now().plusDays(2))
                .maxWeight(BigDecimal.TEN).pricePerKilo(BigDecimal.ONE).build());
        TripBooking booking = bookings.saveAndFlush(TripBooking.builder().trip(trip).sender(owner)
                .title("Documents").recipientContact("recipient@example.com").build());
        ParcelRequest parcel = parcels.saveAndFlush(ParcelRequest.builder().sender(owner)
                .departure("Paris").normalizedDeparture("paris").destination("Abidjan").normalizedDestination("abidjan")
                .packageTitle("Documents").weight(BigDecimal.ONE).build());
        return new String[]{"/users/" + owner.getId() + "/photo", "/parcel-requests/" + parcel.getId() + "/photo",
                "/trips/" + trip.getId() + "/bookings/" + booking.getId() + "/photo"};
    }

    private User account() {
        return users.saveAndFlush(User.builder().firstName("Photo").lastName("Owner")
                .email(UUID.randomUUID() + "@photo.test").password("unused").build());
    }
    private Cookie cookie(User owner) { return new Cookie("COLICLIC_AUTH", jwt.generateToken(owner)); }
    private static Path createUploadsDirectory() {
        try { return Files.createTempDirectory("colick-photo-security-"); }
        catch (java.io.IOException ex) { throw new java.io.UncheckedIOException(ex); }
    }
}
