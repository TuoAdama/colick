package com.coliclic.backoffice.messaging;

import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.messaging.dto.*;
import com.coliclic.backoffice.messaging.entity.Conversation;
import com.coliclic.backoffice.messaging.entity.Message;
import com.coliclic.backoffice.messaging.repository.ConversationRepository;
import com.coliclic.backoffice.messaging.repository.MessageRepository;
import com.coliclic.backoffice.messaging.notification.MessageEmailNotificationThrottle;
import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.parcelrequest.repository.ParcelRequestRepository;
import com.coliclic.backoffice.messaging.service.MessagingServiceImpl;
import com.coliclic.backoffice.support.TestLocalizedMessages;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessagingServiceImplTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private ParcelRequestRepository parcelRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private MessageEmailNotificationThrottle notificationThrottle;

    @Spy
    private LocalizedMessages localizedMessages = TestLocalizedMessages.create();

    @InjectMocks
    private MessagingServiceImpl messagingService;

    private User alice;
    private User bob;
    private Trip sampleTrip;
    private ParcelRequest sampleParcelRequest;
    private Conversation sampleConversation;
    private Conversation sampleParcelConversation;

    @BeforeEach
    void setUp() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        lenient().when(notificationThrottle.tryAcquire(anyLong(), anyLong())).thenReturn(true);
        alice = User.builder()
                .id(1L)
                .firstName("Alice")
                .lastName("Dupont")
                .email("alice@example.com")
                .role(User.Role.USER)
                .build();

        bob = User.builder()
                .id(2L)
                .firstName("Bob")
                .lastName("Martin")
                .email("bob@example.com")
                .role(User.Role.USER)
                .build();

        sampleTrip = Trip.builder()
                .id(10L)
                .traveler(alice)
                .departureAddress("Paris")
                .destination("Abidjan")
                .departureTime(LocalDateTime.now().plusDays(5))
                .arrivalTime(LocalDateTime.now().plusDays(6))
                .maxWeight(BigDecimal.valueOf(20))
                .pricePerKilo(BigDecimal.valueOf(5))
                .status(Trip.TripStatus.ACTIVE)
                .build();

        sampleConversation = Conversation.builder()
                .id(100L)
                .trip(sampleTrip)
                .participant1(alice)
                .participant2(bob)
                .createdAt(LocalDateTime.now())
                .build();

        sampleParcelRequest = ParcelRequest.builder()
                .id(20L)
                .sender(alice)
                .departure("Paris")
                .normalizedDeparture("paris")
                .destination("Abidjan")
                .normalizedDestination("abidjan")
                .packageTitle("Documents")
                .weight(BigDecimal.ONE)
                .status(ParcelRequest.ParcelRequestStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleParcelConversation = Conversation.builder()
                .id(200L)
                .parcelRequest(sampleParcelRequest)
                .participant1(alice)
                .participant2(bob)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ---- startConversation -------------------------------------------------

    @Test
    void startConversation_shouldCreateNewConversation() {
        StartConversationRequest request = new StartConversationRequest();
        request.setTripId(10L);
        request.setRecipientId(2L);
        request.setContent("Hello, I have a parcel to send!");

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

        // No existing conversation in either direction
        when(conversationRepository.findByTripAndParticipant1AndParticipant2(sampleTrip, alice, bob))
                .thenReturn(Optional.empty());
        when(conversationRepository.findByTripAndParticipant1AndParticipant2(sampleTrip, bob, alice))
                .thenReturn(Optional.empty());

        when(conversationRepository.save(any(Conversation.class))).thenReturn(sampleConversation);

        Message savedMessage = Message.builder()
                .id(1L)
                .conversation(sampleConversation)
                .sender(alice)
                .content("Hello, I have a parcel to send!")
                .sentAt(LocalDateTime.now())
                .read(false)
                .build();
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        // For building the ConversationResponse
        when(messageRepository.findTopByConversationOrderBySentAtDesc(sampleConversation))
                .thenReturn(Optional.of(savedMessage));
        when(messageRepository.countByConversationAndReadFalseAndSenderNot(sampleConversation, alice))
                .thenReturn(0L);

        ConversationResponse response = messagingService.startConversation(request, alice);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getTripId()).isEqualTo(10L);
        assertThat(response.getTripRoute()).isEqualTo("Paris → Abidjan");
        assertThat(response.getContextType()).isEqualTo("TRIP");
        assertThat(response.getContextId()).isEqualTo(10L);
        assertThat(response.getContextRoute()).isEqualTo("Paris → Abidjan");
        assertThat(response.getOtherParticipantId()).isEqualTo(2L);
        assertThat(response.getOtherParticipantName()).isEqualTo("Bob Martin");
        assertThat(response.getLastMessage()).isEqualTo("Hello, I have a parcel to send!");

        verify(conversationRepository).save(any(Conversation.class));
        verify(messageRepository).save(any(Message.class));
        verify(emailService).sendNewMessageEmail(
                "bob@example.com", "Bob", "Alice Dupont", "Paris → Abidjan",
                "http://localhost:4200/messages?conversationId=100"
        );
    }

    @Test
    void createConversationDraft_shouldCreateParcelRequestConversation() {
        CreateConversationDraftRequest request = new CreateConversationDraftRequest();
        request.setParcelRequestId(20L);
        request.setRecipientId(2L);

        when(parcelRequestRepository.findById(20L)).thenReturn(Optional.of(sampleParcelRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(conversationRepository.findByParcelRequestAndParticipant1AndParticipant2(sampleParcelRequest, alice, bob))
                .thenReturn(Optional.empty());
        when(conversationRepository.findByParcelRequestAndParticipant1AndParticipant2(sampleParcelRequest, bob, alice))
                .thenReturn(Optional.empty());
        when(conversationRepository.save(any(Conversation.class))).thenReturn(sampleParcelConversation);
        when(messageRepository.findTopByConversationOrderBySentAtDesc(sampleParcelConversation))
                .thenReturn(Optional.empty());
        when(messageRepository.countByConversationAndReadFalseAndSenderNot(sampleParcelConversation, alice))
                .thenReturn(0L);

        ConversationResponse response = messagingService.createConversationDraft(request, alice);

        assertThat(response.getId()).isEqualTo(200L);
        assertThat(response.getTripId()).isNull();
        assertThat(response.getTripRoute()).isNull();
        assertThat(response.getContextType()).isEqualTo("PARCEL_REQUEST");
        assertThat(response.getContextId()).isEqualTo(20L);
        assertThat(response.getContextRoute()).isEqualTo("Paris → Abidjan");
        verify(conversationRepository).save(argThat(conversation ->
                conversation.getTrip() == null && conversation.getParcelRequest().equals(sampleParcelRequest)
        ));
    }

    @Test
    void startConversation_shouldSendMessageForParcelRequestConversation() {
        StartConversationRequest request = new StartConversationRequest();
        request.setParcelRequestId(20L);
        request.setRecipientId(2L);
        request.setContent("Bonjour, je voyage bientot.");

        Message savedMessage = Message.builder()
                .id(20L)
                .conversation(sampleParcelConversation)
                .sender(alice)
                .content("Bonjour, je voyage bientot.")
                .sentAt(LocalDateTime.now())
                .read(false)
                .build();

        when(parcelRequestRepository.findById(20L)).thenReturn(Optional.of(sampleParcelRequest));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(conversationRepository.findByParcelRequestAndParticipant1AndParticipant2(sampleParcelRequest, alice, bob))
                .thenReturn(Optional.of(sampleParcelConversation));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(messageRepository.findTopByConversationOrderBySentAtDesc(sampleParcelConversation))
                .thenReturn(Optional.of(savedMessage));
        when(messageRepository.countByConversationAndReadFalseAndSenderNot(sampleParcelConversation, alice))
                .thenReturn(0L);

        ConversationResponse response = messagingService.startConversation(request, alice);

        assertThat(response.getId()).isEqualTo(200L);
        assertThat(response.getContextType()).isEqualTo("PARCEL_REQUEST");
        assertThat(response.getLastMessage()).isEqualTo("Bonjour, je voyage bientot.");
        verify(messageRepository).save(any(Message.class));
        verify(emailService).sendNewMessageEmail(
                "bob@example.com", "Bob", "Alice Dupont", "Paris → Abidjan",
                "http://localhost:4200/messages?conversationId=200"
        );
    }

    @Test
    void sendMessage_shouldKeepMessageWhenNotificationFails() {
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("On my way!");
        Message savedMessage = Message.builder()
                .id(3L).conversation(sampleConversation).sender(bob)
                .content("On my way!").sentAt(LocalDateTime.now()).read(false)
                .build();
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        doThrow(new IllegalStateException("SMTP unavailable")).when(emailService).sendNewMessageEmail(
                anyString(), anyString(), anyString(), anyString(), anyString());

        MessageResponse response = messagingService.sendMessage(100L, request, bob);

        assertThat(response.getId()).isEqualTo(3L);
        verify(messageRepository).save(any(Message.class));
        verify(emailService).sendNewMessageEmail(
                "alice@example.com", "Alice", "Bob Martin", "Paris → Abidjan",
                "http://localhost:4200/messages?conversationId=100"
        );
        verify(notificationThrottle).release(100L, 1L);
    }

    @Test
    void startConversation_shouldThrowWhenContextIsMissing() {
        StartConversationRequest request = new StartConversationRequest();
        request.setRecipientId(2L);
        request.setContent("Hello");

        assertThatThrownBy(() -> messagingService.startConversation(request, alice))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("context");
    }

    @Test
    void startConversation_shouldReuseExistingConversation() {
        StartConversationRequest request = new StartConversationRequest();
        request.setTripId(10L);
        request.setRecipientId(2L);
        request.setContent("Any updates?");

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

        // Existing conversation found on first lookup
        when(conversationRepository.findByTripAndParticipant1AndParticipant2(sampleTrip, alice, bob))
                .thenReturn(Optional.of(sampleConversation));

        Message savedMessage = Message.builder()
                .id(2L)
                .conversation(sampleConversation)
                .sender(alice)
                .content("Any updates?")
                .sentAt(LocalDateTime.now())
                .read(false)
                .build();
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        when(messageRepository.findTopByConversationOrderBySentAtDesc(sampleConversation))
                .thenReturn(Optional.of(savedMessage));
        when(messageRepository.countByConversationAndReadFalseAndSenderNot(sampleConversation, alice))
                .thenReturn(0L);

        ConversationResponse response = messagingService.startConversation(request, alice);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getLastMessage()).isEqualTo("Any updates?");

        // Conversation must NOT be saved again (reused)
        verify(conversationRepository, never()).save(any(Conversation.class));
        verify(messageRepository).save(any(Message.class));
    }

    // ---- getMessages -------------------------------------------------------

    @Test
    void getMessages_shouldReturnSortedMessages() {
        Message msg1 = Message.builder()
                .id(1L).conversation(sampleConversation).sender(alice)
                .content("Hi!").sentAt(LocalDateTime.now().minusMinutes(10)).read(true)
                .build();
        Message msg2 = Message.builder()
                .id(2L).conversation(sampleConversation).sender(bob)
                .content("Hello!").sentAt(LocalDateTime.now().minusMinutes(5)).read(false)
                .build();

        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.findByConversationAndReadFalseAndSenderNot(sampleConversation, alice))
                .thenReturn(List.of(msg2));
        when(messageRepository.saveAll(List.of(msg2))).thenReturn(List.of(msg2));
        when(messageRepository.findByConversationOrderBySentAtAsc(sampleConversation))
                .thenReturn(List.of(msg1, msg2));

        List<MessageResponse> messages = messagingService.getMessages(100L, alice);

        assertThat(messages).hasSize(2);
        assertThat(messages.get(0).getContent()).isEqualTo("Hi!");
        assertThat(messages.get(1).getContent()).isEqualTo("Hello!");

        // msg2 should have been marked as read
        assertThat(msg2.isRead()).isTrue();
    }

    @Test
    void getMessages_shouldThrow_whenUserNotParticipant() {
        User stranger = User.builder()
                .id(99L)
                .firstName("Charlie")
                .lastName("Doe")
                .email("charlie@example.com")
                .role(User.Role.USER)
                .build();

        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));

        assertThatThrownBy(() -> messagingService.getMessages(100L, stranger))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not a participant");
    }

    // ---- sendMessage -------------------------------------------------------

    @Test
    void sendMessage_shouldSaveAndReturn() {
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("On my way!");

        Message savedMessage = Message.builder()
                .id(3L)
                .conversation(sampleConversation)
                .sender(bob)
                .content("On my way!")
                .sentAt(LocalDateTime.now())
                .read(false)
                .build();

        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        MessageResponse response = messagingService.sendMessage(100L, request, bob);

        assertThat(response.getId()).isEqualTo(3L);
        assertThat(response.getContent()).isEqualTo("On my way!");
        assertThat(response.getSenderId()).isEqualTo(2L);
        assertThat(response.getSenderName()).isEqualTo("Bob Martin");
        assertThat(response.isRead()).isFalse();

        verify(messageRepository).save(any(Message.class));
        verify(emailService).sendNewMessageEmail(
                "alice@example.com", "Alice", "Bob Martin", "Paris → Abidjan",
                "http://localhost:4200/messages?conversationId=100"
        );
    }

    @Test
    void sendMessage_shouldSuppressEmailDuringExistingNotificationWindow() {
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Another message");
        Message savedMessage = Message.builder()
                .id(4L).conversation(sampleConversation).sender(bob)
                .content("Another message").sentAt(LocalDateTime.now()).read(false)
                .build();
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);
        when(notificationThrottle.tryAcquire(100L, 1L)).thenReturn(false);

        messagingService.sendMessage(100L, request, bob);

        verify(notificationThrottle).tryAcquire(100L, 1L);
        verifyNoInteractions(emailService);
    }

    @Test
    void getMessages_shouldReleaseNotificationWindowOnlyAfterCommit() {
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.findByConversationAndReadFalseAndSenderNot(sampleConversation, alice))
                .thenReturn(List.of());
        when(messageRepository.findByConversationOrderBySentAtAsc(sampleConversation))
                .thenReturn(List.of());

        TransactionSynchronizationManager.setActualTransactionActive(true);
        TransactionSynchronizationManager.initSynchronization();
        try {
            messagingService.getMessages(100L, alice);

            verify(notificationThrottle, never()).release(100L, 1L);
            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(TransactionSynchronization::afterCommit);

            verify(notificationThrottle).release(100L, 1L);
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
            TransactionSynchronizationManager.setActualTransactionActive(false);
        }
    }

    @Test
    void sendMessage_shouldNotifyOnlyAfterTransactionCommit() {
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("On my way!");
        Message savedMessage = Message.builder()
                .id(3L)
                .conversation(sampleConversation)
                .sender(bob)
                .content("On my way!")
                .sentAt(LocalDateTime.now())
                .read(false)
                .build();
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        TransactionSynchronizationManager.setActualTransactionActive(true);
        TransactionSynchronizationManager.initSynchronization();
        try {
            messagingService.sendMessage(100L, request, bob);

            verifyNoInteractions(emailService);
            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(TransactionSynchronization::afterCommit);

            verify(emailService).sendNewMessageEmail(
                    "alice@example.com", "Alice", "Bob Martin", "Paris → Abidjan",
                    "http://localhost:4200/messages?conversationId=100"
            );
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
            TransactionSynchronizationManager.setActualTransactionActive(false);
        }
    }

    @Test
    void sendMessage_shouldNotNotifyWhenTransactionRollsBack() {
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("On my way!");
        Message savedMessage = Message.builder()
                .id(3L)
                .conversation(sampleConversation)
                .sender(bob)
                .content("On my way!")
                .sentAt(LocalDateTime.now())
                .read(false)
                .build();
        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        TransactionSynchronizationManager.setActualTransactionActive(true);
        TransactionSynchronizationManager.initSynchronization();
        try {
            messagingService.sendMessage(100L, request, bob);
            TransactionSynchronizationManager.getSynchronizations().forEach(synchronization ->
                    synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

            verifyNoInteractions(emailService);
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
            TransactionSynchronizationManager.setActualTransactionActive(false);
        }
    }

    // ---- Edge cases --------------------------------------------------------

    @Test
    void startConversation_shouldThrow_whenTripNotFound() {
        StartConversationRequest request = new StartConversationRequest();
        request.setTripId(999L);
        request.setRecipientId(2L);
        request.setContent("Hello");

        when(tripRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messagingService.startConversation(request, alice))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Trip not found");
    }

    @Test
    void startConversation_shouldThrow_whenRecipientNotFound() {
        StartConversationRequest request = new StartConversationRequest();
        request.setTripId(10L);
        request.setRecipientId(999L);
        request.setContent("Hello");

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messagingService.startConversation(request, alice))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void startConversation_shouldThrow_whenChattingWithSelf() {
        StartConversationRequest request = new StartConversationRequest();
        request.setTripId(10L);
        request.setRecipientId(1L);
        request.setContent("Hello myself");

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));

        assertThatThrownBy(() -> messagingService.startConversation(request, alice))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("yourself");
    }

    @Test
    void sendMessage_shouldThrow_whenConversationNotFound() {
        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Hello");

        when(conversationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messagingService.sendMessage(999L, request, alice))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Conversation not found");
    }

    @Test
    void sendMessage_shouldThrow_whenUserNotParticipant() {
        User stranger = User.builder()
                .id(99L)
                .firstName("Charlie")
                .lastName("Doe")
                .email("charlie@example.com")
                .role(User.Role.USER)
                .build();

        SendMessageRequest request = new SendMessageRequest();
        request.setContent("Sneaky message");

        when(conversationRepository.findById(100L)).thenReturn(Optional.of(sampleConversation));

        assertThatThrownBy(() -> messagingService.sendMessage(100L, request, stranger))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("not a participant");
        verifyNoInteractions(emailService);
    }

    @Test
    void getMyConversations_shouldReturnConversationsForUser() {
        when(conversationRepository.findByParticipant1OrParticipant2(alice, alice))
                .thenReturn(List.of(sampleConversation));

        Message lastMsg = Message.builder()
                .id(5L).conversation(sampleConversation).sender(bob)
                .content("See you!").sentAt(LocalDateTime.now()).read(false)
                .build();
        when(messageRepository.findTopByConversationOrderBySentAtDesc(sampleConversation))
                .thenReturn(Optional.of(lastMsg));
        when(messageRepository.countByConversationAndReadFalseAndSenderNot(sampleConversation, alice))
                .thenReturn(1L);

        List<ConversationResponse> conversations = messagingService.getMyConversations(alice);

        assertThat(conversations).hasSize(1);
        ConversationResponse conv = conversations.get(0);
        assertThat(conv.getId()).isEqualTo(100L);
        assertThat(conv.getLastMessage()).isEqualTo("See you!");
        assertThat(conv.getUnreadCount()).isEqualTo(1L);
        assertThat(conv.getOtherParticipantName()).isEqualTo("Bob Martin");
    }

    // ---- createConversationDraft --------------------------------------------

    @Test
    void createConversationDraft_shouldCreateConversationWithoutMessage() {
        CreateConversationDraftRequest request = new CreateConversationDraftRequest();
        request.setTripId(10L);
        request.setRecipientId(2L);

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

        when(conversationRepository.findByTripAndParticipant1AndParticipant2(sampleTrip, alice, bob))
                .thenReturn(Optional.empty());
        when(conversationRepository.findByTripAndParticipant1AndParticipant2(sampleTrip, bob, alice))
                .thenReturn(Optional.empty());

        when(conversationRepository.save(any(Conversation.class))).thenReturn(sampleConversation);

        when(messageRepository.findTopByConversationOrderBySentAtDesc(sampleConversation))
                .thenReturn(Optional.empty());
        when(messageRepository.countByConversationAndReadFalseAndSenderNot(sampleConversation, alice))
                .thenReturn(0L);

        ConversationResponse response = messagingService.createConversationDraft(request, alice);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getTripId()).isEqualTo(10L);
        assertThat(response.getTripRoute()).isEqualTo("Paris → Abidjan");
        assertThat(response.getOtherParticipantId()).isEqualTo(2L);
        assertThat(response.getOtherParticipantName()).isEqualTo("Bob Martin");
        assertThat(response.getLastMessage()).isNull();

        verify(conversationRepository).save(any(Conversation.class));
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    void createConversationDraft_shouldReuseExistingConversation() {
        CreateConversationDraftRequest request = new CreateConversationDraftRequest();
        request.setTripId(10L);
        request.setRecipientId(2L);

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

        when(conversationRepository.findByTripAndParticipant1AndParticipant2(sampleTrip, alice, bob))
                .thenReturn(Optional.of(sampleConversation));

        when(messageRepository.findTopByConversationOrderBySentAtDesc(sampleConversation))
                .thenReturn(Optional.empty());
        when(messageRepository.countByConversationAndReadFalseAndSenderNot(sampleConversation, alice))
                .thenReturn(0L);

        ConversationResponse response = messagingService.createConversationDraft(request, alice);

        assertThat(response.getId()).isEqualTo(100L);

        verify(conversationRepository, never()).save(any(Conversation.class));
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    void createConversationDraft_shouldThrow_whenChattingWithSelf() {
        CreateConversationDraftRequest request = new CreateConversationDraftRequest();
        request.setTripId(10L);
        request.setRecipientId(1L);

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));

        assertThatThrownBy(() -> messagingService.createConversationDraft(request, alice))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("yourself");
    }
}
