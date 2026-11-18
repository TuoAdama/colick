package com.coliclic.backoffice.dispute;

import com.coliclic.backoffice.contact.ratelimit.ContactRateLimiter;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.TooManyRequestsException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestController
public class DisputeController {
    private static final Logger log = LoggerFactory.getLogger(DisputeController.class);

    private final DisputeRepository disputes;
    private final ContactRateLimiter rateLimiter;
    private final EmailService emailService;
    private final LocalizedMessages messages;

    public DisputeController(DisputeRepository disputes, ContactRateLimiter rateLimiter,
                             EmailService emailService, LocalizedMessages messages) {
        this.disputes = disputes;
        this.rateLimiter = rateLimiter;
        this.emailService = emailService;
        this.messages = messages;
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
            StringBuilder body = new StringBuilder("Dossier n°").append(dispute.getId()).append("\n\n");
            if (dispute.getTripReference() != null) {
                body.append("Référence du trajet : ").append(dispute.getTripReference()).append("\n\n");
            }
            if (dispute.getBookingReference() != null) {
                body.append("Référence de la réservation : ").append(dispute.getBookingReference()).append("\n\n");
            }
            emailService.sendContactMessage(email, "[Litige] Réclamation", body.append(dispute.getDescription()).toString());
        } catch (MailException | IllegalStateException ex) {
            log.warn("Could not send the support email for dispute {} ({})", dispute.getId(), ex.getClass().getSimpleName());
        }
    }

    private static String optionalReference(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
