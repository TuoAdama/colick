package com.coliclic.backoffice.email;

import com.coliclic.backoffice.i18n.LocalizedMessages;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.core.io.ClassPathResource;
import org.thymeleaf.spring6.ISpringTemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.context.IContext;

import java.util.Properties;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.ArgumentCaptor;

class EmailServiceContactTest {
    @Test
    void sendsTripBookingCreatedEmailWithDirectReservationUrl() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        ISpringTemplateEngine templateEngine = mock(ISpringTemplateEngine.class);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("email/trip-booking-created"), any(IContext.class)))
                .thenReturn("<a href=\"https://app.coliclic.com/trips/10/reservations/1\">Voir la demande</a>");
        LocalizedMessages messages = mock(LocalizedMessages.class);
        when(messages.getForLocale(any(), eq("email.subject.tripBookingCreated")))
                .thenReturn("New booking request - Coliclic");
        EmailService service = new EmailService(mailSender, templateEngine, messages,
                "noreply@coliclic.app", "support@coliclic.app");

        service.sendTripBookingCreatedEmail("alice@example.com", "Alice", "Bob", "Paris", "Abidjan",
                "https://app.coliclic.com/trips/10/reservations/1");

        ArgumentCaptor<IContext> contextCaptor = ArgumentCaptor.forClass(IContext.class);
        verify(templateEngine).process(eq("email/trip-booking-created"), contextCaptor.capture());
        assertThat(contextCaptor.getValue().getVariable("reservationUrl"))
                .isEqualTo("https://app.coliclic.com/trips/10/reservations/1");
        assertThat(mimeMessage.getContent().toString())
                .contains("https://app.coliclic.com/trips/10/reservations/1");
        String template = new ClassPathResource("templates/email/trip-booking-created.html")
                .getContentAsString(StandardCharsets.UTF_8);
        assertThat(template).contains("th:href=\"${reservationUrl}\"", "email.tripBookingCreated.cta");
    }

    @Test
    void sendsContactMessageToSupportWithSenderAsReplyTo() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        LocalizedMessages messages = mock(LocalizedMessages.class);
        EmailService service = new EmailService(mailSender, mock(ISpringTemplateEngine.class), messages,
                "noreply@coliclic.app", "support@coliclic.app");

        service.sendContactMessage("ada@example.com", "Une question", "Bonjour l'équipe");

        verify(mailSender).send(mimeMessage);
        assertThat(mimeMessage.getAllRecipients()[0].toString()).isEqualTo("support@coliclic.app");
        assertThat(mimeMessage.getReplyTo()[0].toString()).isEqualTo("ada@example.com");
        assertThat(mimeMessage.getSubject()).isEqualTo("[Contact] Une question");
        assertThat(mimeMessage.getContent().toString()).contains("Email : ada@example.com", "Sujet : Une question", "Bonjour l'équipe");
    }
}
