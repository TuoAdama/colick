package com.coliclic.backoffice.dispute;

import com.coliclic.backoffice.contact.ratelimit.ContactRateLimiter;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.TooManyRequestsException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;

@RestController
public class DisputeController {
    private static final Logger log = LoggerFactory.getLogger(DisputeController.class);

    private final DisputeRepository disputes;
    private final ContactRateLimiter rateLimiter;
    private final EmailService emailService;
    private final LocalizedMessages messages;
    private final String frontendBaseUrl;

    public DisputeController(DisputeRepository disputes, ContactRateLimiter rateLimiter,
                             EmailService emailService, LocalizedMessages messages,
                             @Value("${app.frontend.base-url}") String frontendBaseUrl) {
        this.disputes = disputes;
        this.rateLimiter = rateLimiter;
        this.emailService = emailService;
        this.messages = messages;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @PostMapping("/disputes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submit(@Valid @RequestBody DisputeRequest request, HttpServletRequest servletRequest) {
        String email = request.email().strip();
        var decision = rateLimiter.check(email, servletRequest.getRemoteAddr());
        if (!decision.allowed()) {
            throw new TooManyRequestsException(messages.get("error.contact.tooManyRequests"), decision.retryAfterSeconds());
        }

        Dispute dispute;
        try {
            dispute = disputes.save(new Dispute(Instant.now(), email, request.description().strip(),
                    optionalReference(request.tripReference()), optionalReference(request.bookingReference())));
        } catch (DataAccessException ex) {
            log.error("Could not save dispute ({})", ex.getClass().getSimpleName());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, messages.get("error.unexpected"));
        }

        // The repository transaction has committed before we attempt delivery.
        try {
            String disputeUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                    .pathSegment("admin", "disputes", dispute.getId().toString())
                    .toUriString();
            emailService.sendDisputeNotification(dispute.getId(), email, dispute.getDescription(),
                    dispute.getTripReference(), dispute.getBookingReference(), disputeUrl);
        } catch (RuntimeException ex) {
            log.warn("Could not send the support email for dispute {} ({})", dispute.getId(), ex.getClass().getSimpleName());
        }
    }

    private static String optionalReference(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
