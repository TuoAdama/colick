package com.colick.backoffice.email;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    public EmailService(JavaMailSender mailSender, SpringTemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("noreply@colick.app");
        mailSender.send(message);
    }

    public void sendSignupActivationEmail(String to, String firstName, String confirmUrl) {
        sendTemplateEmail(
                to,
                "Confirmez votre compte Colick / Confirm your Colick account",
                "email/signup-activation",
                Map.of("firstName", firstName, "confirmUrl", confirmUrl)
        );
    }

    public void sendEmailChangeConfirmationEmail(String to, String firstName, String confirmUrl) {
        sendTemplateEmail(
                to,
                "Confirmez votre nouvelle adresse e-mail / Confirm your new email address",
                "email/change-email-confirmation",
                Map.of("firstName", firstName, "confirmUrl", confirmUrl)
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
            helper.setFrom("noreply@colick.app");
            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("Unable to send HTML email", ex);
        }
    }
}
