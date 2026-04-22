package com.colick.backoffice.config;

import com.colick.backoffice.auth.filter.JwtAuthFilter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class SecurityConfigTest {

    @Mock
    private JwtAuthFilter jwtAuthFilter;

    @InjectMocks
    private SecurityConfig securityConfig;

    @Test
    void corsConfigurationSource_shouldUseConfiguredAllowedOrigins() {
        ReflectionTestUtils.setField(
                securityConfig,
                "corsAllowedOrigins",
                "https://app.colick.com, https://admin.colick.com"
        );

        UrlBasedCorsConfigurationSource source =
                (UrlBasedCorsConfigurationSource) securityConfig.corsConfigurationSource();
        CorsConfiguration config = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/users"));

        assertThat(config).isNotNull();
        assertThat(config.getAllowedOrigins()).containsExactly("https://app.colick.com", "https://admin.colick.com");
    }
}
