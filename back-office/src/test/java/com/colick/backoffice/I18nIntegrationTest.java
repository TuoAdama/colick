package com.colick.backoffice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class I18nIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void forgotPassword_shouldTranslateSuccessMessageInEnglish() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contextPath("/api")
                        .servletPath("/auth/forgot-password")
                        .header("Accept-Language", "en")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@example.com"}
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("If an account exists for this email, a password reset link has been sent"));
    }

    @Test
    void forgotPassword_shouldTranslateSuccessMessageInFrench() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contextPath("/api")
                        .servletPath("/auth/forgot-password")
                        .header("Accept-Language", "fr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@example.com"}
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("Si un compte existe pour cette adresse e-mail, un lien de réinitialisation a été envoyé"));
    }

    @Test
    void loginValidation_shouldTranslateErrorsInFrench() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contextPath("/api")
                        .servletPath("/auth/login")
                        .header("Accept-Language", "fr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ne doit pas être vide")));
    }

    @Test
    void securedEndpoint_shouldTranslateUnauthorizedMessageInEnglish() throws Exception {
        mockMvc.perform(get("/api/trips/mine")
                        .contextPath("/api")
                        .servletPath("/trips/mine")
                        .header("Accept-Language", "en"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    @Test
    void landingFeed_shouldBeAccessibleWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/trips/landing-feed")
                        .contextPath("/api")
                        .servletPath("/trips/landing-feed")
                        .queryParam("limit", "3")
                        .header("Accept-Language", "fr"))
                .andExpect(status().isOk());
    }

    @Test
    void tripReferenceLookup_shouldBeAccessibleWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/trips/reference/TRP-404")
                        .contextPath("/api")
                        .servletPath("/trips/reference/TRP-404")
                        .header("Accept-Language", "en"))
                .andExpect(status().isNotFound());
    }
}
