package com.colick.backoffice.email;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Service for sending transactional emails.
 */
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a plain-text email.
     *
     * @param to      recipient email address
     * @param subject email subject
     * @param body    email body
     */
    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        message.setFrom("noreply@colick.app");
        mailSender.send(message);
    }

    /**
     * Sends an HTML email.
     *
     * @param to       recipient email address
     * @param subject  email subject
     * @param htmlBody HTML body
     */
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
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
