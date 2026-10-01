package com.coliclic.backoffice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BackOfficeApplicationTests {

    @Value("${spring.application.name}")
    private String applicationName;

    @Test
    void contextLoads() {
        assertThat(applicationName).isEqualTo("coliclic-back-office");
    }
}
