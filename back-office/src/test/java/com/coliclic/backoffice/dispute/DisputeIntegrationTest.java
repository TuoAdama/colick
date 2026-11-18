package com.coliclic.backoffice.dispute;

import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import com.coliclic.backoffice.contact.ratelimit.ContactRateLimiter;
import com.coliclic.backoffice.email.EmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mail.MailSendException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.thymeleaf.exceptions.TemplateProcessingException;

import java.time.Instant;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.frontend.base-url=https://preprod.coliclic.example/")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DisputeIntegrationTest {
    private static final String EMAIL = "ada@example.com";
    private static final String DESCRIPTION = "Le colis est arrivé endommagé.";
    private static final String VALID_SUBMISSION = """
            {"email":"ada@example.com","description":"  Le colis est arrivé endommagé.  ",
             "tripReference":" TRIP-1 ","bookingReference":" "}
            """;

    @Autowired MockMvc mvc;
    @Autowired DisputeRepository disputes;
    @MockitoBean ContactRateLimiter rateLimiter;
    @MockitoBean EmailService emailService;

    @BeforeEach
    void allowRequests() {
        when(rateLimiter.check(anyString(), anyString())).thenReturn(RateLimitDecision.allowedDecision());
    }

    @AfterEach
    void cleanDisputes() {
        disputes.deleteAll();
    }

    @ParameterizedTest
    @MethodSource("notificationFailures")
    void publicSubmissionIsSavedAndCanBeReadByAnAdministratorEvenIfEmailFails(RuntimeException failure) throws Exception {
        doAnswer(invocation -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            Dispute saved = disputes.findAll().getFirst();
            assertThat(invocation.getArguments()).containsExactly(
                    saved.getId(), EMAIL, DESCRIPTION, "TRIP-1", null,
                    "https://preprod.coliclic.example/admin/disputes/" + saved.getId());
            throw failure;
        }).when(emailService).sendDisputeNotification(anyLong(), anyString(), anyString(), any(), any(), anyString());

        mvc.perform(submission(VALID_SUBMISSION).with(csrf())).andExpect(status().isNoContent());
        long id = disputes.findAll().getFirst().getId();

        mvc.perform(admin("").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.items[0].id").value(id))
                .andExpect(jsonPath("$.items[0].description").doesNotExist());
        mvc.perform(admin("/" + id).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(jsonPath("$.receivedAt").isNotEmpty())
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.description").value(DESCRIPTION))
                .andExpect(jsonPath("$.tripReference").value("TRIP-1"))
                .andExpect(jsonPath("$.bookingReference").doesNotExist());
    }

    static Stream<RuntimeException> notificationFailures() {
        return Stream.of(new MailSendException("Mailbox unavailable"),
                new TemplateProcessingException("Failed to render dispute template"));
    }

    @Test
    void rejectsInvalidRequestsAndMissingCsrfBeforeSavingOrSendingMail() throws Exception {
        mvc.perform(submission(VALID_SUBMISSION)).andExpect(status().isForbidden());
        mvc.perform(submission("""
                {"email":"not-an-email","description":" "}
                """).with(csrf())).andExpect(status().isBadRequest());
        mvc.perform(submission("""
                {"email":"ada@example.com","description":"%s","bookingReference":"%s"}
                """.formatted("d".repeat(4701), "r".repeat(101))).with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("description")))
                .andExpect(jsonPath("$.message", containsString("bookingReference")));
        assertThat(disputes.count()).isZero();
        verifyNoInteractions(rateLimiter, emailService);
    }

    @Test
    void throttlesSubmissionsBeforeSavingOrSendingMail() throws Exception {
        when(rateLimiter.check(EMAIL, "127.0.0.1")).thenReturn(RateLimitDecision.rejected(60));

        mvc.perform(submission(VALID_SUBMISSION).with(csrf()))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"));
        assertThat(disputes.count()).isZero();
        verifyNoInteractions(emailService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "/1", "/invalid"})
    void requiresAdminForListAndDetail(String suffix) throws Exception {
        mvc.perform(admin(suffix)).andExpect(status().isUnauthorized());
        mvc.perform(admin(suffix).with(user("regular").roles("USER"))).andExpect(status().isForbidden());
    }

    @Test
    void paginatesNewestFirstWithIdAsTieBreaker() throws Exception {
        Instant newer = Instant.parse("2026-11-18T12:00:00Z");
        long firstAtNewerDate = insert(newer);
        long older = insert(newer.minusSeconds(30));
        long lastAtNewerDate = insert(newer);

        mvc.perform(admin("").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].id").value(lastAtNewerDate))
                .andExpect(jsonPath("$.items[1].id").value(firstAtNewerDate))
                .andExpect(jsonPath("$.items[2].id").value(older));
        mvc.perform(admin("").with(user("admin").roles("ADMIN")).param("size", "1").param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.items[0].id").value(firstAtNewerDate));
    }

    @Test
    void distinguishesEmptyListsInvalidParametersAndMissingDisputes() throws Exception {
        var admin = user("admin").roles("ADMIN");
        mvc.perform(admin("").with(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
        mvc.perform(admin("").with(admin).param("page", "-1")).andExpect(status().isBadRequest());
        mvc.perform(admin("").with(admin).param("size", "101")).andExpect(status().isBadRequest());
        mvc.perform(admin("").with(admin).param("page", "abc")).andExpect(status().isBadRequest());
        mvc.perform(admin("/1").with(admin)).andExpect(status().isNotFound());
    }

    private long insert(Instant date) {
        return disputes.save(new Dispute(date, EMAIL, DESCRIPTION, null, null)).getId();
    }

    private MockHttpServletRequestBuilder submission(String body) {
        return post("/api/disputes").contextPath("/api").contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private MockHttpServletRequestBuilder admin(String suffix) {
        return get("/api/admin/disputes" + suffix).contextPath("/api");
    }
}
