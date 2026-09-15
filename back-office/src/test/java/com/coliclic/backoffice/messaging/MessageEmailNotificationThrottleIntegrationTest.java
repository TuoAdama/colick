package com.coliclic.backoffice.messaging;

import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.messaging.dto.SendMessageRequest;
import com.coliclic.backoffice.messaging.entity.Conversation;
import com.coliclic.backoffice.messaging.notification.MessageEmailNotificationThrottle;
import com.coliclic.backoffice.messaging.repository.ConversationRepository;
import com.coliclic.backoffice.messaging.repository.MessageRepository;
import com.coliclic.backoffice.messaging.service.MessagingService;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@Import(MessageEmailNotificationThrottleIntegrationTest.ThrottleTestConfiguration.class)
class MessageEmailNotificationThrottleIntegrationTest {

    @Autowired
    private MessagingService messagingService;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InMemoryNotificationThrottle notificationThrottle;

    @MockitoBean
    private EmailService emailService;

    private User alice;
    private User bob;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        tripRepository.deleteAll();
        userRepository.deleteAll();
        notificationThrottle.clear();
        reset(emailService);

        alice = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Dupont")
                .email("alice-throttle@example.com")
                .password("password")
                .build());
        bob = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Martin")
                .email("bob-throttle@example.com")
                .password("password")
                .build());
        Trip trip = tripRepository.save(Trip.builder()
                .reference("TRP-THROTTLE-TEST")
                .traveler(alice)
                .departureAddress("Paris")
                .destination("Abidjan")
                .departureTime(LocalDateTime.now().plusDays(5))
                .arrivalTime(LocalDateTime.now().plusDays(6))
                .maxWeight(BigDecimal.TEN)
                .pricePerKilo(BigDecimal.valueOf(5))
                .build());
        conversation = conversationRepository.save(Conversation.builder()
                .trip(trip)
                .participant1(alice)
                .participant2(bob)
                .build());
    }

    @Test
    void shouldThrottleBurstAndAllowEmailAgainAfterMessagesAreRead() {
        messagingService.sendMessage(conversation.getId(), request("First message"), bob);
        messagingService.sendMessage(conversation.getId(), request("Second message"), bob);

        verify(emailService, times(1)).sendNewMessageEmail(
                anyString(), anyString(), anyString(), anyString(), anyString());

        messagingService.getMessages(conversation.getId(), alice);
        messagingService.sendMessage(conversation.getId(), request("After reading"), bob);

        verify(emailService, times(2)).sendNewMessageEmail(
                anyString(), anyString(), anyString(), anyString(), anyString());
        assertThat(messageRepository.findByConversationOrderBySentAtAsc(conversation)).hasSize(3);
    }

    private SendMessageRequest request(String content) {
        SendMessageRequest request = new SendMessageRequest();
        request.setContent(content);
        return request;
    }

    @TestConfiguration
    static class ThrottleTestConfiguration {

        @Bean
        @Primary
        InMemoryNotificationThrottle inMemoryNotificationThrottle() {
            return new InMemoryNotificationThrottle();
        }
    }

    static class InMemoryNotificationThrottle implements MessageEmailNotificationThrottle {

        private final Set<String> keys = ConcurrentHashMap.newKeySet();

        @Override
        public boolean tryAcquire(Long conversationId, Long recipientId) {
            return keys.add(key(conversationId, recipientId));
        }

        @Override
        public void release(Long conversationId, Long recipientId) {
            keys.remove(key(conversationId, recipientId));
        }

        void clear() {
            keys.clear();
        }

        private String key(Long conversationId, Long recipientId) {
            return conversationId + ":" + recipientId;
        }
    }
}
