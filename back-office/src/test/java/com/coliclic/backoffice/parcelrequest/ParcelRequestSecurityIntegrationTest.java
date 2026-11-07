package com.coliclic.backoffice.parcelrequest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.parcelrequest.repository.ParcelRequestRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.math.BigDecimal;
import java.util.List;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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

    @Autowired
    private ParcelRequestRepository requests;

    @Autowired
    private UserRepository users;

    @ParameterizedTest
    @EnumSource(ParcelRequest.ParcelRequestStatus.class)
    @Transactional
    void ownerCanReadDetailInEveryStatus(ParcelRequest.ParcelRequestStatus requestStatus) throws Exception {
        User owner = createUser("owner@example.test");
        ParcelRequest request = createRequest(owner, requestStatus);
        mockMvc.perform(get("/api/parcel-requests/" + request.getId())
                        .contextPath("/api").servletPath("/parcel-requests/" + request.getId())
                        .with(authentication(new UsernamePasswordAuthenticationToken(owner, null, List.of()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(request.getId()))
                .andExpect(jsonPath("$.packageTitle").value("Documents"))
                .andExpect(jsonPath("$.status").value(requestStatus.name()));
    }

    @Test
    @Transactional
    void otherOwnerCannotReadDetail() throws Exception {
        User owner = createUser("owner@example.test");
        User other = createUser("other@example.test");
        ParcelRequest request = createRequest(owner, ParcelRequest.ParcelRequestStatus.ACTIVE);
        mockMvc.perform(get("/api/parcel-requests/" + request.getId())
                        .contextPath("/api").servletPath("/parcel-requests/" + request.getId())
                        .with(authentication(new UsernamePasswordAuthenticationToken(other, null, List.of()))))
                .andExpect(status().isForbidden());
    }

    @Test
    @Transactional
    void missingDetailReturns404() throws Exception {
        User owner = createUser("owner@example.test");
        mockMvc.perform(get("/api/parcel-requests/9223372036854775807")
                        .contextPath("/api").servletPath("/parcel-requests/9223372036854775807")
                        .with(authentication(new UsernamePasswordAuthenticationToken(owner, null, List.of()))))
                .andExpect(status().isNotFound());
    }

    @Test
    void anonymousCannotReadDetail() throws Exception {
        mockMvc.perform(get("/api/parcel-requests/1")
                        .contextPath("/api").servletPath("/parcel-requests/1"))
                .andExpect(status().isUnauthorized());
    }

    private User createUser(String email) {
        return users.save(User.builder().firstName("Alice").lastName("Sender")
                .email(email).password("unused").build());
    }

    private ParcelRequest createRequest(User owner, ParcelRequest.ParcelRequestStatus requestStatus) {
        return requests.save(ParcelRequest.builder().sender(owner)
                .departure("Paris").normalizedDeparture("paris")
                .destination("Abidjan").normalizedDestination("abidjan")
                .packageTitle("Documents").weight(BigDecimal.ONE).status(requestStatus).build());
    }

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
