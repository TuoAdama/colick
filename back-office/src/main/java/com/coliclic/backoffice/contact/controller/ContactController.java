package com.coliclic.backoffice.contact.controller;

import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import com.coliclic.backoffice.contact.dto.ContactRequest;
import com.coliclic.backoffice.contact.ratelimit.ContactRateLimiter;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.TooManyRequestsException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ContactController {
    private final EmailService emailService;
    private final ContactRateLimiter rateLimiter;
    private final LocalizedMessages localizedMessages;

    public ContactController(EmailService emailService, ContactRateLimiter rateLimiter, LocalizedMessages localizedMessages) {
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
        this.localizedMessages = localizedMessages;
    }

    @PostMapping("/contact")
    public ResponseEntity<Void> send(@Valid @RequestBody ContactRequest request, HttpServletRequest servletRequest) {
        RateLimitDecision decision = rateLimiter.check(request.getEmail(), servletRequest.getRemoteAddr());
        if (!decision.allowed()) {
            throw new TooManyRequestsException(localizedMessages.get("error.contact.tooManyRequests"), decision.retryAfterSeconds());
        }
        emailService.sendContactMessage(request.getEmail().trim(), request.getSubject().trim(), request.getMessage().trim());
        return ResponseEntity.noContent().build();
    }
}
