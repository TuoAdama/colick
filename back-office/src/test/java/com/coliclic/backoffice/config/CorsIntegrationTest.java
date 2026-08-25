package com.coliclic.backoffice.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.cors.allowed-origins=https://preprod.coliclic.com")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CorsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void registrationPreflight_shouldAllowPreprodOrigin() throws Exception {
        mockMvc.perform(options("/api/users")
                        .contextPath("/api")
                        .servletPath("/users")
                        .header(HttpHeaders.ORIGIN, "https://preprod.coliclic.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.POST.name())
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, HttpHeaders.CONTENT_TYPE))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "https://preprod.coliclic.com"));
    }

    @Test
    void registrationPreflight_shouldRejectProductionOriginInPreprod() throws Exception {
        mockMvc.perform(options("/api/users")
                        .contextPath("/api")
                        .servletPath("/users")
                        .header(HttpHeaders.ORIGIN, "https://coliclic.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.POST.name())
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, HttpHeaders.CONTENT_TYPE))
                .andExpect(status().isForbidden());
    }
}
