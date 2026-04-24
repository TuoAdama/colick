package com.colick.backoffice.email;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

/**
 * Service for sending transactional emails.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final String fromAddress;
    private final String supportEmail;

    public EmailService(JavaMailSender mailSender,
                        SpringTemplateEngine templateEngine,
                        @Value("${app.mail.from-address:noreply@colick.app}") String fromAddress,
                        @Value("${app.mail.support-email:support@colick.app}") String supportEmail) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
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
                "Confirmez votre compte Colick / Confirm your Colick account",
                "email/signup-activation",
                Map.of("firstName", firstName, "confirmUrl", confirmUrl, "supportEmail", supportEmail)
        );
    }

    public void sendEmailChangeConfirmationEmail(String to, String firstName, String confirmUrl) {
        sendTemplateEmail(
                to,
                "Confirmez votre nouvelle adresse e-mail / Confirm your new email address",
                "email/change-email-confirmation",
                Map.of("firstName", firstName, "confirmUrl", confirmUrl, "supportEmail", supportEmail)
        );
    }

    public void sendPasswordResetEmail(String to, String firstName, String resetUrl, long expirationMinutes) {
        sendTemplateEmail(
                to,
                "Réinitialisez votre mot de passe Colick / Reset your Colick password",
                "email/password-reset",
                Map.of(
                        "firstName", firstName,
                        "resetUrl", resetUrl,
                        "supportEmail", supportEmail,
                        "expirationMinutes", expirationMinutes
                )
        );
    }

    private void sendTemplateEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        Context context = new Context();
        variables.forEach(context::setVariable);
        String htmlBody = templateEngine.process(templateName, context);

        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom(fromAddress);
            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Unable to send HTML email", ex);
        }
    }
}
