package com.coliclic.backoffice.dispute;

import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import com.coliclic.backoffice.contact.ratelimit.ContactRateLimiter;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DisputeControllerTest {
    @Test
    void aFailedSaveDoesNotTriggerAnEmail() {
        var repository = mock(DisputeRepository.class);
        var limiter = mock(ContactRateLimiter.class);
        var email = mock(EmailService.class);
        var messages = mock(LocalizedMessages.class);
        when(limiter.check(anyString(), anyString())).thenReturn(RateLimitDecision.allowedDecision());
        when(repository.save(any(Dispute.class))).thenThrow(new DataAccessResourceFailureException("Offline"));
        var controller = new DisputeController(repository, limiter, email, messages, "https://coliclic.example");

        assertThatThrownBy(() -> controller.submit(
                new DisputeRequest("ada@example.com", "Mon colis est introuvable.", null, null),
                new MockHttpServletRequest()))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR));
        verifyNoInteractions(email);
    }
}
