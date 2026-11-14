package com.coliclic.backoffice.auth;

import com.coliclic.backoffice.auth.controller.AuthController;
import com.coliclic.backoffice.auth.dto.LoginRequest;
import com.coliclic.backoffice.auth.google.GoogleTokenPayload;
import com.coliclic.backoffice.auth.google.GoogleTokenVerifier;
import com.coliclic.backoffice.auth.passwordreset.entity.PasswordResetToken;
import com.coliclic.backoffice.auth.passwordreset.repository.PasswordResetTokenRepository;
import com.coliclic.backoffice.auth.passwordreset.service.PasswordResetService;
import com.coliclic.backoffice.auth.ratelimit.AuthRateLimiter;
import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class GoogleLocalPasswordLoginIntegrationTest {

    @Autowired private MockMvc mvc;
    @MockitoBean private GoogleTokenVerifier googleTokenVerifier;

    @Test
    void legacyNullActivationFlag_shouldAllowGoogleLoginAndProtectedRequests() throws Exception {
        String email = "legacy-google@example.com";
        userRepository.saveAndFlush(User.builder().firstName("Ada").lastName("Lovelace").email(email)
                .password("unused-random-hash").enabled(null).googleSubject("legacy-google-subject").build());
        when(googleTokenVerifier.verify("legacy-google-token")).thenReturn(
                new GoogleTokenPayload(
                        "legacy-google-subject", email, "Ada", "Lovelace", "Ada Lovelace", true));

        var login = mvc.perform(post("/api/auth/google")
                        .contextPath("/api").servletPath("/auth/google")
                        .with(csrf())
                        .contentType("application/json").content("{\"idToken\":\"legacy-google-token\"}"))
                .andExpect(status().isOk()).andReturn();
        var cookie = login.getResponse().getCookie("COLICLIC_AUTH");
        assertThat(cookie).isNotNull();
        mvc.perform(get("/api/auth/session")
                        .contextPath("/api").servletPath("/auth/session").cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private AuthController authController;

    @MockitoBean
    private AuthRateLimiter authRateLimiter;

    @Test
    void googleUser_shouldKeepGoogleLinkAndLoginLocallyAfterPasswordReset() throws Exception {
        User user = userRepository.save(User.builder()
                .firstName("Ada")
                .lastName("Lovelace")
                .email("google-local-login@example.com")
                .password("unused-random-hash")
                .localAuthEnabled(false)
                .authProvider(User.AuthProvider.GOOGLE)
                .googleSubject("google-subject-local-login")
                .enabled(true)
                .role(User.Role.USER)
                .build());
        String rawToken = "google-local-reset-token";
        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .tokenHash(sha256(rawToken))
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build());

        passwordResetService.resetPassword(rawToken, "StrongPass1");

        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.getLocalAuthEnabled()).isTrue();
        assertThat(updatedUser.getGoogleSubject()).isEqualTo("google-subject-local-login");
        assertThat(updatedUser.getAuthProvider()).isEqualTo(User.AuthProvider.GOOGLE);

        when(authRateLimiter.checkLogin(anyString(), anyString()))
                .thenReturn(RateLimitDecision.allowedDecision());
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(updatedUser.getEmail());
        loginRequest.setPassword("StrongPass1");
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        servletRequest.setRemoteAddr("203.0.113.7");

        var response = authController.login(loginRequest, servletRequest, new MockHttpServletResponse());

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getUser().getEmail()).isEqualTo(updatedUser.getEmail());
        assertThat(response.getBody().getUser().getHasPassword()).isTrue();
    }

    private String sha256(String value) throws Exception {
        byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(digest);
    }
}
