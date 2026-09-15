package com.coliclic.backoffice.contact;

import com.coliclic.backoffice.auth.ratelimit.RateLimitDecision;
import com.coliclic.backoffice.contact.ratelimit.ContactRateLimiter;
import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContactControllerIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private EmailService emailService;
    @MockitoBean private ContactRateLimiter rateLimiter;
    @MockitoBean private UserRepository userRepository;
    @MockitoBean private TripRepository tripRepository;

    @Test
    void publicContactRequest_requiresCsrfButNotAuthentication() throws Exception {
        when(rateLimiter.check(any(), any())).thenReturn(RateLimitDecision.allowedDecision());

        mockMvc.perform(post("/api/contact").with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contextPath("/api").servletPath("/contact").contentType("application/json")
                        .content("{\"email\":\"ada@example.com\",\"subject\":\"Question\",\"message\":\"Bonjour\"}"))
                .andExpect(status().isNoContent());
        verify(emailService).sendContactMessage("ada@example.com", "Question", "Bonjour");
    }

    @Test
    void contactRequest_withoutCsrf_isRejected() throws Exception {
        mockMvc.perform(post("/api/contact").contextPath("/api").servletPath("/contact")
                        .contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidContactRequest_isRejectedWithoutSendingEmail() throws Exception {
        mockMvc.perform(post("/api/contact").with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contextPath("/api").servletPath("/contact").contentType("application/json")
                        .content("{\"email\":\"invalid\",\"subject\":\"\",\"message\":\"\"}"))
                .andExpect(status().isBadRequest());
        verify(emailService, never()).sendContactMessage(any(), any(), any());
    }

    @Test
    void rateLimitedContactRequest_returnsRetryAfter() throws Exception {
        when(rateLimiter.check(any(), any())).thenReturn(RateLimitDecision.rejected(42));

        mockMvc.perform(post("/api/contact").with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contextPath("/api").servletPath("/contact").contentType("application/json")
                        .content("{\"email\":\"ada@example.com\",\"subject\":\"Question\",\"message\":\"Bonjour\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "42"));
    }

    @Test
    void profileReport_validatesAndAddsContextToTheSupportEmail() throws Exception {
        User traveler = User.builder().id(7L).firstName("Ada").lastName("Lovelace")
                .email("ada@example.com").password("encoded").build();
        Trip trip = Trip.builder().id(12L).traveler(traveler).build();
        when(rateLimiter.check(any(), any())).thenReturn(RateLimitDecision.allowedDecision());
        when(userRepository.findById(7L)).thenReturn(Optional.of(traveler));
        when(tripRepository.findById(12L)).thenReturn(Optional.of(trip));

        mockMvc.perform(post("/api/contact").with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contextPath("/api").servletPath("/contact").contentType("application/json")
                        .content("""
                                {"email":"reporter@example.com","subject":"Comportement préoccupant",
                                 "message":"Merci de vérifier ce profil.","category":"PROFILE_REPORT",
                                 "travelerId":7,"tripId":12}
                                """))
                .andExpect(status().isNoContent());

        verify(emailService).sendContactMessage(
                "reporter@example.com",
                "[Signalement profil] Comportement préoccupant",
                "Voyageur signalé : 7\nTrajet concerné : 12\n\nMerci de vérifier ce profil.");
    }
}
