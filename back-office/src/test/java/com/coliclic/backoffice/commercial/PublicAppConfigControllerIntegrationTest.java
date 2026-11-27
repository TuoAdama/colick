package com.coliclic.backoffice.commercial;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "app.contact.turnstile.site-key=public-key",
        "app.contact.turnstile.secret-key=private-key"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicAppConfigControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void exposesFreeConfigurationWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/public/app-config")
                        .contextPath("/api")
                        .servletPath("/public/app-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commercialMode").value("FREE"))
                .andExpect(jsonPath("$.platformFeeRate").value(0))
                .andExpect(jsonPath("$.features.platformPayment").value(false))
                .andExpect(jsonPath("$.features.platformFee").value(false))
                .andExpect(jsonPath("$.contentVariant").value("free"))
                .andExpect(jsonPath("$.analyticsMeasurementId").doesNotExist())
                .andExpect(jsonPath("$.contactTurnstileSiteKey").value("public-key"))
                .andExpect(content().string(not(containsString("private-key"))));
    }
}
