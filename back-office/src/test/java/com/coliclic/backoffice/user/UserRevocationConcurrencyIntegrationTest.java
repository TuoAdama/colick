package com.coliclic.backoffice.user;

import com.coliclic.backoffice.auth.passwordreset.entity.PasswordResetToken;
import com.coliclic.backoffice.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.coliclic.backoffice.auth.passwordreset.service.PasswordResetService;
import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.file.FileStorageService;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserRevocationConcurrencyIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordResetTokenRepository tokens;
    @Autowired PasswordResetService passwordReset;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtUtil jwt;
    @MockitoBean EmailService emails;
    @MockitoBean FileStorageService storage;
    private User owner;
    private String rawResetToken;

    @BeforeEach
    void accountWithLegacyColumnDefaults() throws Exception {
        String email = UUID.randomUUID() + "@concurrency.test";
        // A row without an explicit row_version also exercises its database default.
        jdbc.update("insert into users (first_name, last_name, email, password, role, enabled) values (?, ?, ?, ?, ?, ?)",
                "Ada", "Lovelace", email, passwords.encode("StrongPass1"), "USER", true);
        owner = users.findByEmail(email).orElseThrow();
        assertThat(owner.getRowVersion()).isZero();
        rawResetToken = UUID.randomUUID().toString();
        tokens.saveAndFlush(PasswordResetToken.builder().user(owner)
                .tokenHash(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                        .digest(rawResetToken.getBytes(StandardCharsets.UTF_8))))
                .expiresAt(LocalDateTime.now().plusMinutes(30)).build());
    }

    @AfterEach
    void cleanup() {
        if (owner != null) {
            jdbc.update("delete from password_reset_tokens where user_id = ?", owner.getId());
            users.deleteById(owner.getId());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"photo", "change-email"})
    void staleAccountMutationCannotRestoreARevokedSession(String operation) throws Exception {
        CountDownLatch loadedBeforeReset = new CountDownLatch(1);
        CountDownLatch resetCommitted = new CountDownLatch(1);
        if (operation.equals("photo")) {
            when(storage.storeImage(any(), anyLong())).thenAnswer(invocation -> {
                pauseAfterAccountWasLoaded(loadedBeforeReset, resetCommitted);
                return "/uploads/new-photo.png";
            });
        } else {
            doAnswer(invocation -> {
                pauseAfterAccountWasLoaded(loadedBeforeReset, resetCommitted);
                return null;
            }).when(emails).sendEmailChangeConfirmationEmail(anyString(), anyString(), anyString());
        }

        Cookie oldCookie = new Cookie("COLICLIC_AUTH", jwt.generateToken(owner));
        String path = "/users/" + owner.getId() + "/" + operation;
        try (var executor = Executors.newSingleThreadExecutor()) {
            var pending = executor.submit(() -> {
                var request = operation.equals("photo")
                        ? multipart("/api" + path).file(new MockMultipartFile("file", "photo.png", "image/png", new byte[]{1}))
                        : post("/api" + path).contentType("application/json").content("{\"newEmail\":\"pending@example.com\"}");
                return mvc.perform(request.contextPath("/api").servletPath(path).cookie(oldCookie).with(csrf()))
                        .andReturn().getResponse();
            });
            try {
                assertThat(loadedBeforeReset.await(10, TimeUnit.SECONDS)).isTrue();
                passwordReset.resetPassword(rawResetToken, "NewStrongPass2");
                assertOldCookieRejected(oldCookie);
            } finally {
                resetCommitted.countDown();
            }
            var response = pending.get(10, TimeUnit.SECONDS);
            assertThat(response.getStatus()).isEqualTo(409);
            assertThat(response.getContentAsString()).doesNotContain("rowVersion", "StaleObjectStateException");
        }

        User persisted = users.findById(owner.getId()).orElseThrow();
        assertThat(persisted.getSessionVersion()).isGreaterThan(owner.getSessionVersion());
        assertThat(passwords.matches("NewStrongPass2", persisted.getPassword())).isTrue();
        assertThat(persisted.getPhotoUrl()).isNull();
        assertThat(persisted.getPendingEmail()).isNull();
        assertOldCookieRejected(oldCookie);
        // The rejected stale request can be retried after reloading the current row.
        persisted.setPhone("+33123456789");
        users.saveAndFlush(persisted);
        assertOldCookieRejected(oldCookie);
    }

    private void assertOldCookieRejected(Cookie cookie) throws Exception {
        mvc.perform(get("/api/auth/session").contextPath("/api").servletPath("/auth/session").cookie(cookie))
                .andExpect(status().isUnauthorized());
    }

    private void pauseAfterAccountWasLoaded(CountDownLatch loaded, CountDownLatch reset) throws InterruptedException {
        loaded.countDown();
        if (!reset.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Password reset did not finish");
    }
}
