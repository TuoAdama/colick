package com.coliclic.backoffice.email;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = "management.health.mail.enabled=false")
@ActiveProfiles("test")
class EmailServiceTemplateIntegrationTest {

    @MockitoBean
    private JavaMailSender mailSender;

    @Autowired
    private EmailService emailService;

    @AfterEach
    void clearLocale() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    void rendersTripBookingCreatedTemplateWithResolvedReservationUrl() throws Exception {
        LocaleContextHolder.setLocale(Locale.FRENCH);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        emailService.sendTripBookingCreatedEmail(
                "alice@example.com",
                "Alice",
                "Bob",
                "Paris",
                "Abidjan",
                "https://app.coliclic.com/trips/10/reservations/1"
        );

        verify(mailSender).send(mimeMessage);
        assertThat(mimeMessage.getContent().toString())
                .contains("href=\"https://app.coliclic.com/trips/10/reservations/1\"");
    }
}
