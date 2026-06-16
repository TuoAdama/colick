package com.colick.backoffice.email;

import com.colick.backoffice.i18n.LocalizedMessages;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Locale;
import java.util.Map;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Service for sending transactional emails.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final LocalizedMessages localizedMessages;
    private final String fromAddress;
    private final String supportEmail;

    public EmailService(JavaMailSender mailSender,
                        SpringTemplateEngine templateEngine,
                        LocalizedMessages localizedMessages,
                        @Value("${app.mail.from-address:noreply@colick.app}") String fromAddress,
                        @Value("${app.mail.support-email:support@colick.app}") String supportEmail) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.localizedMessages = localizedMessages;
        this.fromAddress = fromAddress;
        this.supportEmail = supportEmail;
    }

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom(fromAddress);
        mailSender.send(message);
    }

    public void sendSignupActivationEmail(String to, String firstName, String confirmUrl) {
        sendTemplateEmail(
                to,
                "email.subject.signupActivation",
                "email/signup-activation",
                Map.of("firstName", firstName, "confirmUrl", confirmUrl, "supportEmail", supportEmail)
        );
    }

    public void sendEmailChangeConfirmationEmail(String to, String firstName, String confirmUrl) {
        sendTemplateEmail(
                to,
                "email.subject.changeEmailConfirmation",
                "email/change-email-confirmation",
                Map.of("firstName", firstName, "confirmUrl", confirmUrl, "supportEmail", supportEmail)
        );
    }

    public void sendPasswordResetEmail(String to, String firstName, String resetUrl, long expirationMinutes) {
        sendTemplateEmail(
                to,
                "email.subject.passwordReset",
                "email/password-reset",
                Map.of(
                        "firstName", firstName,
                        "resetUrl", resetUrl,
                        "supportEmail", supportEmail,
                        "expirationMinutes", expirationMinutes
                )
        );
    }

    public void sendTripBookingCreatedEmail(String to,
                                            String travelerFirstName,
                                            String senderFirstName,
                                            String departureAddress,
                                            String destination) {
        sendTemplateEmail(
                to,
                "email.subject.tripBookingCreated",
                "email/trip-booking-created",
                Map.of(
                        "firstName", travelerFirstName,
                        "senderFirstName", senderFirstName,
                        "departureAddress", departureAddress,
                        "destination", destination,
                        "supportEmail", supportEmail
                )
        );
    }

    public void sendTripBookingAcceptedEmail(String to,
                                             String senderFirstName,
                                             String departureAddress,
                                             String destination) {
        sendTemplateEmail(
                to,
                "email.subject.tripBookingAccepted",
                "email/trip-booking-accepted",
                Map.of(
                        "firstName", senderFirstName,
                        "departureAddress", departureAddress,
                        "destination", destination,
                        "supportEmail", supportEmail
                )
        );
    }

    public void sendTripBookingRejectedEmail(String to,
                                             String senderFirstName,
                                             String departureAddress,
                                             String destination) {
        sendTemplateEmail(
                to,
                "email.subject.tripBookingRejected",
                "email/trip-booking-rejected",
                Map.of(
                        "firstName", senderFirstName,
                        "departureAddress", departureAddress,
                        "destination", destination,
                        "supportEmail", supportEmail
                )
        );
    }

    public void sendTripBookingRemovedEmail(String to,
                                            String senderFirstName,
                                            String departureAddress,
                                            String destination) {
        sendTemplateEmail(
                to,
                "email.subject.tripBookingRemoved",
                "email/trip-booking-removed",
                Map.of(
                        "firstName", senderFirstName,
                        "departureAddress", departureAddress,
                        "destination", destination,
                        "supportEmail", supportEmail
                )
        );
    }

    public void sendTripCancelledEmail(String to,
                                       String senderFirstName,
                                       String departureAddress,
                                       String destination) {
        sendTemplateEmail(
            to,
            "email.subject.tripCancelled",
            "email/trip-cancelled",
            Map.of(
                "firstName", senderFirstName,
                "departureAddress", departureAddress,
                "destination", destination,
                "supportEmail", supportEmail
            )
        );
    }

    public void sendTripUpdatedEmail(String to,
                                     String senderFirstName,
                                     String departureAddress,
                                     String destination) {
        sendTemplateEmail(
            to,
            "email.subject.tripUpdated",
            "email/trip-updated",
            Map.of(
                "firstName", senderFirstName,
                "departureAddress", departureAddress,
                "destination", destination,
                "supportEmail", supportEmail
            )
        );
    }

    public void sendBookingCancelledBySenderEmail(String to,
                                                  String travelerFirstName,
                                                  String senderFirstName,
                                                  String departureAddress,
                                                  String destination) {
        sendTemplateEmail(
            to,
            "email.subject.bookingCancelledBySender",
            "email/booking-cancelled-by-sender",
            Map.of(
                "firstName", travelerFirstName,
                "senderFirstName", senderFirstName,
                "departureAddress", departureAddress,
                "destination", destination,
                "supportEmail", supportEmail
            )
        );
    }

    public void sendBookingValidationCodeEmail(String to,
                                               String packageTitle,
                                               String validationCode,
                                               String qrCodeDataUri,
                                               String departureAddress,
                                               String destination) {
        sendTemplateEmail(
            to,
            "email.subject.bookingValidationCode",
            "email/booking-validation-code",
            Map.of(
                "packageTitle", packageTitle,
                "validationCode", validationCode,
                "qrCodeDataUri", qrCodeDataUri,
                "departureAddress", departureAddress,
                "destination", destination,
                "supportEmail", supportEmail
            )
        );
    }

    public void sendTravelerReviewInvitationEmail(String to,
                                                  String senderFirstName,
                                                  String travelerFirstName,
                                                  String departureAddress,
                                                  String destination,
                                                  String reviewUrl) {
        sendTemplateEmail(
                to,
                "email.subject.travelerReviewInvitation",
                "email/traveler-review-invitation",
                Map.of(
                        "firstName", senderFirstName,
                        "travelerFirstName", travelerFirstName,
                        "departureAddress", departureAddress,
                        "destination", destination,
                        "reviewUrl", reviewUrl,
                        "supportEmail", supportEmail
                )
        );
    }

    public void sendTripAlertMatchEmail(String to,
                                        String firstName,
                                        String departureAddress,
                                        String destination,
                                        LocalDateTime departureTime,
                                        BigDecimal pricePerKilo,
                                        String searchUrl) {
        sendTemplateEmail(
                to,
                "email.subject.tripAlertMatch",
                "email/trip-alert-match",
                Map.of(
                        "firstName", firstName,
                        "departureAddress", departureAddress,
                        "destination", destination,
                        "departureTime", departureTime,
                        "pricePerKilo", pricePerKilo,
                        "searchUrl", searchUrl,
                        "supportEmail", supportEmail
                )
        );
    }

    private void sendTemplateEmail(String to, String subjectCode, String templateName, Map<String, Object> variables) {
        Locale locale = LocaleContextHolder.getLocale();
        Context context = new Context(locale);
        variables.forEach(context::setVariable);
        String htmlBody = templateEngine.process(templateName, context);

        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject(localizedMessages.getForLocale(locale, subjectCode));
            helper.setText(htmlBody, true);
            helper.setFrom(fromAddress);
            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException(localizedMessages.get("error.email.sendFailed"), ex);
        }
    }
}
