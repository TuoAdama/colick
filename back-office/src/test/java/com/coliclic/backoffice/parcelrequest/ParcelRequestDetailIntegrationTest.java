package com.coliclic.backoffice.parcelrequest;

import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.parcelrequest.repository.ParcelRequestRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import com.coliclic.backoffice.messaging.entity.Conversation;
import com.coliclic.backoffice.messaging.repository.ConversationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ParcelRequestDetailIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ParcelRequestRepository requests;
    @Autowired UserRepository users;
    @Autowired ConversationRepository conversations;
    User owner;
    User other;
    ParcelRequest parcel;
    String path;
    static final String BODY = """
        {"departure":"Lyon, France","destination":"Dakar, Sénégal","packageTitle":"Livres","weight":3,"description":"Fragile"}
        """;

    @BeforeEach void setup() {
        owner = users.save(User.builder().firstName("Alice").lastName("Sender").email("detail-owner@example.com").password("encoded").role(User.Role.USER).build());
        other = users.save(User.builder().firstName("Bob").lastName("Traveler").email("detail-other@example.com").password("encoded").role(User.Role.USER).build());
        parcel = requests.save(ParcelRequest.builder().sender(owner).departure("Paris").normalizedDeparture("paris").destination("Abidjan").normalizedDestination("abidjan").packageTitle("Documents").weight(BigDecimal.ONE).packagePhotoUrl("/uploads/box.png").build());
        path = "/parcel-requests/" + parcel.getId();
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor as(User user) {
        return authentication(new UsernamePasswordAuthenticationToken(user, null, java.util.List.of()));
    }

    @Test void detailAndUpdate_requireOwnerAndValidateBody() throws Exception {
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).with(as(other))).andExpect(status().isForbidden());
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).with(as(owner))).andExpect(status().isOk()).andExpect(jsonPath("$.packageTitle").value("Documents"));
        mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).with(as(owner)).with(csrf()).contentType("application/json").content("{}" )).andExpect(status().isBadRequest());
        mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).with(as(other)).with(csrf()).contentType("application/json").content(BODY)).andExpect(status().isForbidden());
        mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).with(as(owner)).with(csrf()).contentType("application/json").content(BODY)).andExpect(status().isOk()).andExpect(jsonPath("$.packageTitle").value("Livres")).andExpect(jsonPath("$.packagePhotoUrl").value("/uploads/box.png"));
    }

    @Test void cancellationKeepsHistory_removalHidesButPreservesConversation() throws Exception {
        Conversation conversation = conversations.save(Conversation.builder().parcelRequest(parcel).participant1(owner).participant2(other).build());
        mvc.perform(delete("/api" + path).contextPath("/api").servletPath(path).with(as(owner)).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).with(as(owner))).andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(put("/api" + path).contextPath("/api").servletPath(path).with(as(owner)).with(csrf()).contentType("application/json").content(BODY)).andExpect(status().isConflict());
        mvc.perform(delete("/api" + path + "/remove").contextPath("/api").servletPath(path + "/remove").with(as(other)).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete("/api" + path + "/remove").contextPath("/api").servletPath(path + "/remove").with(as(owner)).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api" + path).contextPath("/api").servletPath(path).with(as(owner))).andExpect(status().isNotFound());
        mvc.perform(get("/api/parcel-requests/mine").contextPath("/api").servletPath("/parcel-requests/mine").with(as(owner))).andExpect(jsonPath("$.length()").value(0));
        String messagesPath = "/messaging/conversations/" + conversation.getId() + "/messages";
        mvc.perform(get("/api" + messagesPath).contextPath("/api").servletPath(messagesPath).with(as(owner))).andExpect(status().isOk());
        mvc.perform(post("/api/messaging/conversations/draft").contextPath("/api").servletPath("/messaging/conversations/draft").with(as(other)).with(csrf())
                .contentType("application/json").content("{\"parcelRequestId\":" + parcel.getId() + ",\"recipientId\":" + owner.getId() + "}"))
                .andExpect(status().isNotFound());
        assertThat(requests.findById(parcel.getId())).isPresent();
        assertThat(conversations.findById(conversation.getId())).isPresent();
        assertThat(parcel.getPackagePhotoUrl()).isEqualTo("/uploads/box.png");
    }

    @Test void repositoryQueries_excludeRemovedRowsAndKeepVisibleHistory() {
        ParcelRequest removed = saveRequest(owner, ParcelRequest.ParcelRequestStatus.ACTIVE);
        removed.setDeletedAt(java.time.LocalDateTime.now());
        requests.saveAndFlush(removed);
        ParcelRequest closed = saveRequest(owner, ParcelRequest.ParcelRequestStatus.CLOSED);
        ParcelRequest cancelled = saveRequest(owner, ParcelRequest.ParcelRequestStatus.CANCELLED);
        ParcelRequest otherActive = saveRequest(other, ParcelRequest.ParcelRequestStatus.ACTIVE);

        assertThat(requests.findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(ParcelRequest.ParcelRequestStatus.ACTIVE))
                .extracting(ParcelRequest::getId)
                .containsExactlyInAnyOrder(parcel.getId(), otherActive.getId());
        assertThat(requests.findBySenderAndDeletedAtIsNullOrderByCreatedAtDesc(owner))
                .extracting(ParcelRequest::getId)
                .containsExactlyInAnyOrder(parcel.getId(), closed.getId(), cancelled.getId());
    }

    private ParcelRequest saveRequest(User sender, ParcelRequest.ParcelRequestStatus status) {
        return requests.saveAndFlush(ParcelRequest.builder().sender(sender).departure("Paris")
                .normalizedDeparture("paris").destination("Abidjan").normalizedDestination("abidjan")
                .packageTitle("Livres").weight(BigDecimal.ONE).status(status).build());
    }

    @Test void removedActiveRequest_isExcludedFromPublicSearch() throws Exception {
        mvc.perform(delete("/api" + path + "/remove").contextPath("/api").servletPath(path + "/remove").with(as(owner)).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/parcel-requests").contextPath("/api").servletPath("/parcel-requests")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }
}
