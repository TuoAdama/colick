package com.coliclic.backoffice.traveler;

import com.coliclic.backoffice.messaging.entity.Conversation;
import com.coliclic.backoffice.messaging.entity.Message;
import com.coliclic.backoffice.messaging.repository.MessageRepository;
import com.coliclic.backoffice.traveler.dto.TravelerResponseMetrics;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TravelerReviewRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.service.TravelerReviewService;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TravelerProfileServiceTest {
    @Mock UserRepository users;
    @Mock TripRepository trips;
    @Mock TravelerReviewRepository reviews;
    @Mock TravelerReviewService reviewService;
    @Mock MessageRepository messages;
    TravelerProfileService service;

    @BeforeEach
    void setUp() {
        service = new TravelerProfileService(users, trips, reviews, reviewService, messages);
    }

    @Test
    void calculatesFirstResponseMetricsOverEligibleConversations() {
        User traveler = User.builder().id(7L).build();
        User sender = User.builder().id(8L).build();
        LocalDateTime base = LocalDateTime.of(2026, 9, 1, 10, 0);
        List<Message> history = new ArrayList<>();
        history.addAll(conversation(1L, sender, traveler, base, 30L));
        history.addAll(conversation(2L, sender, traveler, base.plusDays(1), 90L));
        history.addAll(conversation(3L, sender, traveler, base.plusDays(2), null));
        when(messages.findTripConversationMessagesForTraveler(7L)).thenReturn(history);

        TravelerResponseMetrics result = service.calculateResponsiveness(7L, base.minusDays(1));

        assertThat(result.responseSampleSize()).isEqualTo(3);
        assertThat(result.responseRatePercent()).isEqualTo(67);
        assertThat(result.averageResponseTimeMinutes()).isEqualTo(60);
    }

    @Test
    void hidesMetricsBelowThreeIncomingConversations() {
        User traveler = User.builder().id(7L).build();
        User sender = User.builder().id(8L).build();
        LocalDateTime base = LocalDateTime.of(2026, 9, 1, 10, 0);
        when(messages.findTripConversationMessagesForTraveler(7L))
                .thenReturn(conversation(1L, sender, traveler, base, 10L));

        TravelerResponseMetrics result = service.calculateResponsiveness(7L, base.minusDays(1));

        assertThat(result.responseSampleSize()).isEqualTo(1);
        assertThat(result.responseRatePercent()).isNull();
        assertThat(result.averageResponseTimeMinutes()).isNull();
    }

    private List<Message> conversation(Long id, User sender, User traveler,
                                       LocalDateTime start, Long responseDelayMinutes) {
        Conversation conversation = Conversation.builder().id(id).build();
        List<Message> result = new ArrayList<>();
        result.add(Message.builder().id(id * 10).conversation(conversation).sender(sender).sentAt(start).content("Bonjour").build());
        if (responseDelayMinutes != null) {
            result.add(Message.builder().id(id * 10 + 1).conversation(conversation).sender(traveler)
                    .sentAt(start.plusMinutes(responseDelayMinutes)).content("Réponse").build());
        }
        return result;
    }
}
