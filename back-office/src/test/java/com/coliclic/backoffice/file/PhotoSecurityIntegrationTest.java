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
import org.springframework.test.context.transaction.TestTransaction;

import static org.hamcrest.Matchers.containsString;

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
        try (var files = Files.walk(UPLOADS)) {
            assertThat(files.filter(Files::isRegularFile).toList()).isEmpty();
        }
    }

    @Test
    void profileAndParcelListingPhotosRemainPublicAndAreReencoded() throws Exception {
        User traveler = account();
        TripBooking booking = booking(account(), traveler);
        ParcelRequest parcel = parcel(traveler);
        byte[] imageWithTrailingHtml = image(0x223344, true);

        String profilePhoto = upload("/users/" + traveler.getId() + "/photo", traveler, imageWithTrailingHtml, "photoUrl");
        String parcelPhoto = upload("/parcel-requests/" + parcel.getId() + "/photo", traveler, imageWithTrailingHtml, "packagePhotoUrl");
        try {
            mvc.perform(get("/api/trips/catalog").contextPath("/api").servletPath("/trips/catalog"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items[0].id").value(booking.getTrip().getId()))
                    .andExpect(jsonPath("$.items[0].travelerPhotoUrl").value(profilePhoto));
            String profile = "/travelers/" + traveler.getId() + "/profile";
            mvc.perform(get("/api" + profile).contextPath("/api").servletPath(profile))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.photoUrl").value(profilePhoto));
            mvc.perform(get("/api/parcel-requests").contextPath("/api").servletPath("/parcel-requests"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$[0].packagePhotoUrl").value(parcelPhoto));

            for (String url : new String[]{profilePhoto, parcelPhoto}) {
                mvc.perform(get("/api" + url).contextPath("/api").servletPath(url))
                        .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                        .andExpect(header().string("Content-Security-Policy", "default-src 'none'; sandbox"));
                assertThat(Files.readAllBytes(publicPath(url))).isEqualTo(image(0x223344, false));
            }
        } finally {
            Files.deleteIfExists(publicPath(profilePhoto));
            Files.deleteIfExists(publicPath(parcelPhoto));
        }
    }

    @Test
    void onlyParticipantsCanReadALegacyPhotoAndItsOldUrlIsDenied() throws Exception {
        User sender = account();
        User traveler = account();
        User thirdParty = account();
        User admin = account();
        admin.setRole(User.Role.ADMIN);
        users.saveAndFlush(admin);

        TripBooking booking = booking(sender, traveler);
        String path = photoPath(booking);
        String legacyUrl = "/uploads/" + UUID.randomUUID() + ".png";
        byte[] photo = image(0x223344, false);
        Files.write(publicPath(legacyUrl), photo);
        booking.setPackagePhotoUrl(legacyUrl);
        // Even a second reference from a public announcement must not expose the booking photo.
        ParcelRequest parcel = parcel(thirdParty);
        parcel.setPackagePhotoUrl(legacyUrl);
        parcels.saveAndFlush(parcel);
        bookings.saveAndFlush(booking);

        try {
            assertPhoto(path, sender, photo);
            assertPhoto(path, traveler, photo);
            mvc.perform(get("/api" + path).contextPath("/api").servletPath(path)).andExpect(status().isUnauthorized());
            for (User user : new User[]{thirdParty, admin}) {
                mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).cookie(cookie(user)))
                        .andExpect(status().isNotFound());
            }
            assertPublicUrlDenied(legacyUrl);

            String detail = path.substring(0, path.lastIndexOf('/'));
            String sentDetail = detail.replace("/bookings/", "/bookings/mine/");
            mvc.perform(get("/api" + detail).contextPath("/api").servletPath(detail).cookie(cookie(traveler)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.packagePhotoUrl", containsString("/api" + path + "?v=")));
            mvc.perform(get("/api" + sentDetail).contextPath("/api").servletPath(sentDetail).cookie(cookie(sender)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.packagePhotoUrl", containsString("/api" + path + "?v=")));
            String sentList = "/trips/bookings/mine";
            mvc.perform(get("/api" + sentList).contextPath("/api").servletPath(sentList).cookie(cookie(sender)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$[0].packagePhotoUrl", containsString("/api" + path + "?v=")));

            booking.setStatus(TripBooking.BookingStatus.REMOVED);
            bookings.saveAndFlush(booking);
            mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).cookie(cookie(sender)))
                    .andExpect(status().isNotFound());
            assertPublicUrlDenied(legacyUrl);
        } finally {
            Files.deleteIfExists(publicPath(legacyUrl));
        }
    }

    @Test
    void senderCanAddAndReplacePhotoWithVersionedPrivateUrls() throws Exception {
        User sender = account();
        User traveler = account();
        TripBooking booking = booking(sender, traveler);
        String path = photoPath(booking);
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).cookie(cookie(sender)))
                .andExpect(status().isNotFound());

        String addedUrl = upload(path, sender, image(0x112233, true), "packagePhotoUrl");
        String addedReference = bookings.findById(booking.getId()).orElseThrow().getPackagePhotoUrl();
        Path addedFile = UPLOADS.resolve(addedReference);
        try {
            assertThat(addedUrl).startsWith("/api" + path + "?v=").doesNotContain(addedFile.getFileName().toString());
            assertThat(addedReference).startsWith("booking-photos/");
            assertPhoto(path, traveler, image(0x112233, false));
            assertPublicUrlDenied("/uploads/" + addedFile.getFileName());
            assertPublicUrlDenied("/uploads/" + addedReference);

            String replacedUrl = upload(path, sender, image(0x445566, false), "packagePhotoUrl");
            assertThat(replacedUrl).startsWith("/api" + path + "?v=").isNotEqualTo(addedUrl);
            assertPhoto(path, sender, image(0x445566, false));
            assertPhoto(path, traveler, image(0x445566, false));
        } finally {
            TestTransaction.end();
            assertThat(addedFile).doesNotExist();
        }
    }

    @Test
    void rollingBackLegacyReplacementKeepsTheOldPhotoPrivateAndReadable() throws Exception {
        User sender = account();
        User traveler = account();
        TripBooking booking = booking(sender, traveler);
        String legacyUrl = "/uploads/" + UUID.randomUUID() + ".png";
        byte[] legacyPhoto = image(0x112233, false);
        Path original = publicPath(legacyUrl);
        Path moved = UPLOADS.resolve("booking-photos").resolve(original.getFileName());
        Files.write(original, legacyPhoto);
        booking.setPackagePhotoUrl(legacyUrl);
        bookings.saveAndFlush(booking);
        String path = photoPath(booking);
        TestTransaction.flagForCommit();
        TestTransaction.end();

        try {
            TestTransaction.start();
            upload(path, sender, image(0x445566, false), "packagePhotoUrl");
            Path replacement = UPLOADS.resolve(bookings.findById(booking.getId()).orElseThrow().getPackagePhotoUrl());
            TestTransaction.end();
            assertThat(replacement).doesNotExist();
            assertThat(original).doesNotExist();
            assertThat(moved).exists();
            assertPhoto(path, sender, legacyPhoto);
            assertPhoto(path, traveler, legacyPhoto);
            assertPublicUrlDenied(legacyUrl);

            upload(path, sender, image(0x445566, false), "packagePhotoUrl");
            assertPhoto(path, traveler, image(0x445566, false));
            assertThat(moved).doesNotExist();
            assertPublicUrlDenied(legacyUrl);
        } finally {
            Files.deleteIfExists(original);
            Files.deleteIfExists(moved);
            TripBooking persisted = bookings.findById(booking.getId()).orElseThrow();
            if (persisted.getPackagePhotoUrl().startsWith("booking-photos/")) {
                Files.deleteIfExists(UPLOADS.resolve(persisted.getPackagePhotoUrl()));
            }
            bookings.delete(persisted);
            trips.deleteById(booking.getTrip().getId());
            users.deleteById(sender.getId());
            users.deleteById(traveler.getId());
        }
    }

    private String upload(String path, User sender, byte[] photo, String field) throws Exception {
        String response = mvc.perform(multipart("/api" + path)
                        .file(new MockMultipartFile("file", "untrusted.html", "image/png", photo))
                        .contextPath("/api").servletPath(path).cookie(cookie(sender)).with(csrf()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(response).get(field).asText();
    }

    private void assertPhoto(String path, User participant, byte[] expected) throws Exception {
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).cookie(cookie(participant)))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(expected))
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(header().string("Cache-Control", containsString("private")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Content-Security-Policy", "default-src 'none'; sandbox"));
    }

    private void assertPublicUrlDenied(String path) throws Exception {
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path)).andExpect(status().isNotFound());
    }

    private byte[] image(int color, boolean appendHtml) throws Exception {
        var output = new ByteArrayOutputStream();
        var photo = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        photo.setRGB(0, 0, color);
        ImageIO.write(photo, "png", output);
        if (appendHtml) output.write("<html>discard this trailing document</html>".getBytes());
        return output.toByteArray();
    }

    private Path publicPath(String url) {
        return UPLOADS.resolve(url.substring("/uploads/".length()));
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
        TripBooking booking = booking(owner, account());
        ParcelRequest parcel = parcel(owner);
        return new String[]{"/users/" + owner.getId() + "/photo", "/parcel-requests/" + parcel.getId() + "/photo",
                photoPath(booking)};
    }

    private TripBooking booking(User sender, User traveler) {
        Trip trip = trips.saveAndFlush(Trip.builder().reference("PHOTO-" + UUID.randomUUID().toString().substring(0, 8))
                .traveler(traveler).departureAddress("Paris").destination("Abidjan")
                .departureTime(LocalDateTime.now().plusDays(1)).arrivalTime(LocalDateTime.now().plusDays(2))
                .maxWeight(BigDecimal.TEN).pricePerKilo(BigDecimal.ONE).build());
        return bookings.saveAndFlush(TripBooking.builder().trip(trip).sender(sender)
                .title("Documents").recipientContact("recipient@example.com").build());
    }

    private ParcelRequest parcel(User sender) {
        return parcels.saveAndFlush(ParcelRequest.builder().sender(sender)
                .departure("Paris").normalizedDeparture("paris").destination("Abidjan").normalizedDestination("abidjan")
                .packageTitle("Documents").weight(BigDecimal.ONE).build());
    }

    private String photoPath(TripBooking booking) {
        return "/trips/" + booking.getTrip().getId() + "/bookings/" + booking.getId() + "/photo";
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
