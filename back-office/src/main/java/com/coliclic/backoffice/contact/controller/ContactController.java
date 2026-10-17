package com.coliclic.backoffice.contact.controller;

import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import com.coliclic.backoffice.contact.dto.ContactRequest;
import com.coliclic.backoffice.contact.ratelimit.ContactRateLimiter;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.TooManyRequestsException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final TripRepository tripRepository;

    public ContactController(EmailService emailService, ContactRateLimiter rateLimiter,
                             LocalizedMessages localizedMessages, UserRepository userRepository,
                             TripRepository tripRepository) {
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
        this.localizedMessages = localizedMessages;
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
    }

    @PostMapping("/contact")
    public ResponseEntity<Void> send(@Valid @RequestBody ContactRequest request, HttpServletRequest servletRequest) {
        RateLimitDecision decision = rateLimiter.check(request.getEmail(), servletRequest.getRemoteAddr());
        if (!decision.allowed()) {
            throw new TooManyRequestsException(localizedMessages.get("error.contact.tooManyRequests"), decision.retryAfterSeconds());
        }
        String subject = request.getSubject().trim();
        String body = request.getMessage().trim();
        if (request.getCategory() == ContactRequest.Category.PROFILE_REPORT) {
            var traveler = userRepository.findById(request.getTravelerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Profil voyageur introuvable."));
            if (request.getTripId() != null) {
                var trip = tripRepository.findById(request.getTripId())
                        .orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable."));
                if (!trip.getTraveler().getId().equals(traveler.getId())) {
                    throw new BadRequestException("Le trajet ne correspond pas au profil signalé.");
                }
            }
            subject = "[Signalement profil] " + subject;
            body = "Voyageur signalé : " + traveler.getId()
                    + (request.getTripId() == null ? "" : "\nTrajet concerné : " + request.getTripId())
                    + "\n\n" + body;
        }
        emailService.sendContactMessage(request.getEmail().trim(), subject, body);
        return ResponseEntity.noContent().build();
    }
}
