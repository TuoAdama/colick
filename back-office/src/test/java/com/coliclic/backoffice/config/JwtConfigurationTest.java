package com.coliclic.backoffice.config;

import com.coliclic.backoffice.auth.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class JwtConfigurationTest {
    @Test
    void applicationCannotStartWithoutAnExplicitSigningSecret() throws Exception {
        var environment = new MockEnvironment();
        new YamlPropertySourceLoader().load("application", new ClassPathResource("application.yml"))
                .forEach(environment.getPropertySources()::addLast);
        new ApplicationContextRunner().withInitializer(context -> context.setEnvironment(environment))
                .withBean(JwtUtil.class).run(context -> assertThat(context).hasFailed());
    }
}
