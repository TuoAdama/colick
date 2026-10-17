package com.coliclic.backoffice.parcelrequest;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ParcelRequestSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void search_shouldBePublic() throws Exception {
        mockMvc.perform(get("/api/parcel-requests")
                        .contextPath("/api")
                        .servletPath("/parcel-requests")
                        .queryParam("departure", "Paris")
                        .queryParam("destination", "Abidjan"))
                .andExpect(status().isOk());
    }

    @Test
    void personalRequests_shouldRemainProtected() throws Exception {
        mockMvc.perform(get("/api/parcel-requests/mine")
                        .contextPath("/api")
                        .servletPath("/parcel-requests/mine"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void creation_shouldRemainProtected() throws Exception {
        mockMvc.perform(post("/api/parcel-requests")
                        .with(csrf())
                        .contextPath("/api")
                        .servletPath("/parcel-requests")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
