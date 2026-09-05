package com.coliclic.backoffice.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSessionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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
