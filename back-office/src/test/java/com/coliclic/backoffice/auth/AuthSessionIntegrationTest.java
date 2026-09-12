package com.coliclic.backoffice.auth;

import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSessionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void csrfEndpoint_shouldMaterializeAngularXsrfCookie() throws Exception {
        mockMvc.perform(get("/api/auth/csrf").contextPath("/api").servletPath("/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    void session_shouldRequireAValidAuthCookie() throws Exception {
        mockMvc.perform(get("/api/auth/session").contextPath("/api").servletPath("/auth/session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Transactional
    void loginCookie_shouldRestoreTheAuthenticatedSession() throws Exception {
        String email = "session-" + UUID.randomUUID() + "@example.com";
        userRepository.saveAndFlush(User.builder()
                .firstName("Ada")
                .lastName("Lovelace")
                .email(email)
                .password(passwordEncoder.encode("StrongPass1"))
                .enabled(true)
                .localAuthEnabled(true)
                .role(User.Role.USER)
                .build());

        var loginResult = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contextPath("/api")
                        .servletPath("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"StrongPass1\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("COLICLIC_AUTH", 2_592_000))
                .andReturn();

        Cookie authCookie = loginResult.getResponse().getCookie("COLICLIC_AUTH");
        assertThat(authCookie).isNotNull();

        mockMvc.perform(get("/api/auth/session")
                        .contextPath("/api")
                        .servletPath("/auth/session")
                        .cookie(authCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.firstName").value("Ada"));
    }

    @Test
    void logout_shouldExpireCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .with(csrf())
                        .contextPath("/api")
                        .servletPath("/auth/logout"))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", containsString("COLICLIC_AUTH=;")))
                .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
    }

    @Test
    void stateChangingEndpoint_shouldRejectMissingCsrfToken() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contextPath("/api")
                        .servletPath("/auth/forgot-password")
                        .contentType("application/json")
                        .content("{\"email\":\"nobody@example.com\"}"))
                .andExpect(status().isForbidden());
    }
}
