package com.coliclic.backoffice.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "MAIL_SMTP_AUTH=true",
        "MAIL_SMTP_STARTTLS_ENABLE=true"
})
@ActiveProfiles("test")
class MailConfigurationTest {

    @Value("${spring.mail.properties.mail.smtp.auth}")
    private boolean smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable}")
    private boolean startTlsEnabled;

    @Test
    void shouldOverrideSmtpSecurityFromEnvironmentProperties() {
        assertThat(smtpAuth).isTrue();
        assertThat(startTlsEnabled).isTrue();
    }
}
