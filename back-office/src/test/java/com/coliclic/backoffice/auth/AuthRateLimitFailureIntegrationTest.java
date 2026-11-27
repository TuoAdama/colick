package com.coliclic.backoffice.auth;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthRateLimitFailureIntegrationTest {
    @Autowired MockMvc mvc;
    @MockitoBean StringRedisTemplate redis;

    @ParameterizedTest
    @ValueSource(strings = {"/auth/login", "/auth/forgot-password"})
    void redisFailureCannotBypassAuthenticationRateLimits(String path) throws Exception {
        when(redis.execute(any(RedisScript.class), anyList(), any(), any(), any()))
                .thenThrow(new IllegalStateException("Redis unavailable"));
        mvc.perform(post("/api" + path).contextPath("/api").servletPath(path).with(csrf())
                        .contentType("application/json").content("{\"email\":\"test@example.com\",\"password\":\"StrongPass1\"}"))
                .andExpect(status().isTooManyRequests()).andExpect(header().string("Retry-After", "60"));
    }
}
