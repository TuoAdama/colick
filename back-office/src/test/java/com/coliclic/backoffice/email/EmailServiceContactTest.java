package com.coliclic.backoffice.email;

import com.coliclic.backoffice.i18n.LocalizedMessages;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailServiceContactTest {
    @Test
    void sendsContactMessageToSupportWithSenderAsReplyTo() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        LocalizedMessages messages = mock(LocalizedMessages.class);
        EmailService service = new EmailService(mailSender, mock(SpringTemplateEngine.class), messages,
                "noreply@coliclic.app", "support@coliclic.app");

        service.sendContactMessage("ada@example.com", "Une question", "Bonjour l'équipe");

        verify(mailSender).send(mimeMessage);
        assertThat(mimeMessage.getAllRecipients()[0].toString()).isEqualTo("support@coliclic.app");
        assertThat(mimeMessage.getReplyTo()[0].toString()).isEqualTo("ada@example.com");
        assertThat(mimeMessage.getSubject()).isEqualTo("[Contact] Une question");
        assertThat(mimeMessage.getContent().toString()).contains("Email : ada@example.com", "Sujet : Une question", "Bonjour l'équipe");
    }
}
