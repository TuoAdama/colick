package com.coliclic.backoffice.user;

import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.auth.passwordreset.entity.PasswordResetToken;
import com.coliclic.backoffice.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.coliclic.backoffice.auth.passwordreset.service.PasswordResetService;
import com.coliclic.backoffice.email.EmailService;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserSecurityIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired JwtUtil jwt;
    @Autowired PasswordEncoder passwords;
    @Autowired PasswordResetTokenRepository resetTokens;
    @Autowired PasswordResetService passwordReset;
    @MockitoBean EmailService emailService;

    @ParameterizedTest
    @CsvSource({"USER,USER", "USER,ADMIN", "ADMIN,USER", "ADMIN,ADMIN"})
    void crossAccountAccessIsForbiddenForUsersAndAdmins(User.Role actorRole, User.Role targetRole) throws Exception {
        User attacker = account();
        attacker.setRole(actorRole);
        User victim = account();
        victim.setRole(targetRole);
        users.flush();
        Cookie cookie = cookie(attacker);
        String path = "/users/" + victim.getId();
        String originalPassword = victim.getPassword();

        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).cookie(cookie))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).cookie(cookie).with(csrf())
                        .contentType("application/json").content("{\"firstName\":\"Stolen\",\"password\":\"Attacker123\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api" + path + "/change-email").contextPath("/api").servletPath(path + "/change-email")
                        .cookie(cookie).with(csrf()).contentType("application/json")
                        .content("{\"newEmail\":\"attacker@example.com\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(multipart("/api" + path + "/photo").file(new MockMultipartFile("file", "test.html", "text/html", new byte[]{1}))
                        .contextPath("/api").servletPath(path + "/photo").cookie(cookie).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api" + path + "/change-password").contextPath("/api").servletPath(path + "/change-password")
                        .cookie(cookie).with(csrf()).contentType("application/json")
                        .content("{\"oldPassword\":\"StrongPass1\",\"newPassword\":\"Attacker123\"}"))
                .andExpect(status().isForbidden());

        assertThat(victim.getPassword()).isEqualTo(originalPassword);
        assertThat(victim.getFirstName()).isEqualTo("Ada");
        assertThat(victim.getPendingEmail()).isNull();
        verifyNoInteractions(emailService);
    }

    @Test
    void ownProfileCanBeReadAndEditedButCannotSetAPassword() throws Exception {
        User owner = account();
        owner.setLocalAuthEnabled(false);
        String originalPassword = owner.getPassword();
        String path = "/users/" + owner.getId();
        Cookie cookie = cookie(owner);
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).cookie(cookie))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(owner.getEmail()));
        mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).cookie(cookie).with(csrf())
                        .contentType("application/json").content("{\"firstName\":\"Grace\",\"password\":\"Attacker123\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.firstName").value("Grace"));
        assertThat(owner.getPassword()).isEqualTo(originalPassword);
        assertThat(owner.getLocalAuthEnabled()).isFalse();
    }

    @Test
    void passwordChangeRevokesEveryPreviouslyIssuedCookie() throws Exception {
        User owner = account();
        Cookie oldCookie = cookie(owner);
        String path = "/users/" + owner.getId() + "/change-password";
        mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).cookie(oldCookie).with(csrf())
                        .contentType("application/json")
                        .content("{\"oldPassword\":\"StrongPass1\",\"newPassword\":\"NewStrongPass2\"}"))
                .andExpect(status().isOk());
        assertSession(oldCookie, 401);
        assertSession(cookie(owner), 200);
    }

    @Test
    void passwordResetRevokesExistingCookie() throws Exception {
        User owner = account();
        Cookie oldCookie = cookie(owner);
        String token = UUID.randomUUID().toString();
        resetTokens.saveAndFlush(PasswordResetToken.builder().user(owner)
                .tokenHash(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))))
                .expiresAt(LocalDateTime.now().plusMinutes(30)).build());
        passwordReset.resetPassword(token, "NewStrongPass2");
        users.flush();
        assertSession(oldCookie, 401);
        assertSession(cookie(owner), 200);
    }

    @Test
    void disablingAccountRevokesCookiePermanentlyEvenAfterReactivation() throws Exception {
        User owner = account();
        Cookie oldCookie = cookie(owner);
        owner.setEnabled(false);
        users.flush();
        assertSession(oldCookie, 401);
        owner.setEnabled(true);
        users.flush();
        assertSession(oldCookie, 401);
        assertSession(cookie(owner), 200);
    }

    private void assertSession(Cookie cookie, int status) throws Exception {
        mvc.perform(get("/api/auth/session").contextPath("/api").servletPath("/auth/session").cookie(cookie))
                .andExpect(status().is(status));
    }

    private Cookie cookie(User user) {
        return new Cookie("COLICLIC_AUTH", jwt.generateToken(user));
    }

    private User account() {
        return users.saveAndFlush(User.builder().firstName("Ada").lastName("Lovelace")
                .email(UUID.randomUUID() + "@security.test").password(passwords.encode("StrongPass1")).build());
    }
}
