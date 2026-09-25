package com.coliclic.backoffice.messaging.service;

import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.messaging.dto.*;
import com.coliclic.backoffice.messaging.entity.Conversation;
import com.coliclic.backoffice.messaging.entity.Message;
import com.coliclic.backoffice.messaging.notification.MessageEmailNotificationThrottle;
import com.coliclic.backoffice.messaging.repository.ConversationRepository;
import com.coliclic.backoffice.messaging.repository.MessageRepository;
import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.parcelrequest.repository.ParcelRequestRepository;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of {@link MessagingService}.
 */
@Service
@Transactional
public class MessagingServiceImpl implements MessagingService {

    private static final Logger log = LoggerFactory.getLogger(MessagingServiceImpl.class);

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final TripRepository tripRepository;
    private final ParcelRequestRepository parcelRequestRepository;
    private final UserRepository userRepository;
    private final LocalizedMessages localizedMessages;
    private final EmailService emailService;
    private final MessageEmailNotificationThrottle notificationThrottle;

    @Value("${app.frontend.base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    public MessagingServiceImpl(ConversationRepository conversationRepository,
                                MessageRepository messageRepository,
                                TripRepository tripRepository,
                                ParcelRequestRepository parcelRequestRepository,
                                UserRepository userRepository,
                                LocalizedMessages localizedMessages,
                                EmailService emailService,
                                MessageEmailNotificationThrottle notificationThrottle) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.tripRepository = tripRepository;
        this.parcelRequestRepository = parcelRequestRepository;
        this.userRepository = userRepository;
        this.localizedMessages = localizedMessages;
        this.emailService = emailService;
        this.notificationThrottle = notificationThrottle;
    }

    @Override
    public ConversationResponse startConversation(StartConversationRequest request, User currentUser) {
        ConversationContext context = resolveContext(request.getTripId(), request.getParcelRequestId());
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        localizedMessages.get("error.user.notFound", request.getRecipientId())));

        if (currentUser.getId().equals(recipient.getId())) {
            throw new BadRequestException(localizedMessages.get("error.messaging.selfConversation"));
        }

        Conversation conversation = findExistingConversation(context, currentUser, recipient)
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .trip(context.trip())
                            .parcelRequest(context.parcelRequest())
                            .participant1(currentUser)
                            .participant2(recipient)
                            .build();
                    return conversationRepository.save(newConv);
                });

        // Send the first (or additional) message
        Message message = Message.builder()
                .conversation(conversation)
                .sender(currentUser)
                .content(request.getContent())
                .build();
        messageRepository.save(message);
        notifyRecipientAfterCommit(conversation, currentUser, recipient);

        return toConversationResponse(conversation, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getMyConversations(User currentUser) {
        List<Conversation> conversations =
                conversationRepository.findByParticipant1OrParticipant2(currentUser, currentUser);

        return conversations.stream()
                .map(conv -> toConversationResponse(conv, currentUser))
                .toList();
    }

    @Override
    public List<MessageResponse> getMessages(Long conversationId, User currentUser) {
        Conversation conversation = findConversationOrThrow(conversationId);
        assertParticipant(conversation, currentUser);

        // Mark messages from the other participant as read
        List<Message> unread = messageRepository
                .findByConversationAndReadFalseAndSenderNot(conversation, currentUser);
        unread.forEach(m -> m.setRead(true));
        messageRepository.saveAll(unread);
        runAfterCommit(() -> notificationThrottle.release(conversationId, currentUser.getId()));

        return messageRepository.findByConversationOrderBySentAtAsc(conversation).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Override
    public MessageResponse sendMessage(Long conversationId, SendMessageRequest request, User currentUser) {
        Conversation conversation = findConversationOrThrow(conversationId);
        assertParticipant(conversation, currentUser);

        Message message = Message.builder()
                .conversation(conversation)
                .sender(currentUser)
                .content(request.getContent())
                .build();

        MessageResponse response = MessageResponse.from(messageRepository.save(message));
        User recipient = getOtherParticipant(conversation, currentUser);
        notifyRecipientAfterCommit(conversation, currentUser, recipient);
        return response;
    }

    @Override
    public ConversationResponse createConversationDraft(CreateConversationDraftRequest request, User currentUser) {
        ConversationContext context = resolveContext(request.getTripId(), request.getParcelRequestId());
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        localizedMessages.get("error.user.notFound", request.getRecipientId())));

        if (currentUser.getId().equals(recipient.getId())) {
            throw new BadRequestException(localizedMessages.get("error.messaging.selfConversation"));
        }

        Conversation conversation = findExistingConversation(context, currentUser, recipient)
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .trip(context.trip())
                            .parcelRequest(context.parcelRequest())
                            .participant1(currentUser)
                            .participant2(recipient)
                            .build();
                    return conversationRepository.save(newConv);
                });

        return toConversationResponse(conversation, currentUser);
    }

    // ---- Private helpers ---------------------------------------------------

    /**
     * Finds an existing conversation for a trip between two users,
     * checking both orderings of participant1/participant2.
     */
    private Optional<Conversation> findExistingConversation(ConversationContext context, User userA, User userB) {
        if (context.trip() != null) {
            return conversationRepository.findByTripAndParticipant1AndParticipant2(context.trip(), userA, userB)
                    .or(() -> conversationRepository.findByTripAndParticipant1AndParticipant2(context.trip(), userB, userA));
        }
        return conversationRepository.findByParcelRequestAndParticipant1AndParticipant2(context.parcelRequest(), userA, userB)
                .or(() -> conversationRepository.findByParcelRequestAndParticipant1AndParticipant2(context.parcelRequest(), userB, userA));
    }

    private Conversation findConversationOrThrow(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        localizedMessages.get("error.conversation.notFound", id)));
    }

    /**
     * Ensures the given user is a participant in the conversation.
     *
     * @throws AccessDeniedException if the user is not a participant
     */
    private void assertParticipant(Conversation conversation, User user) {
        boolean isParticipant = conversation.getParticipant1().getId().equals(user.getId())
                || conversation.getParticipant2().getId().equals(user.getId());
        if (!isParticipant) {
            throw new AccessDeniedException(localizedMessages.get("error.messaging.notParticipant"));
        }
    }

    private User getOtherParticipant(Conversation conversation, User currentUser) {
        return conversation.getParticipant1().getId().equals(currentUser.getId())
                ? conversation.getParticipant2()
                : conversation.getParticipant1();
    }

    private void notifyRecipientAfterCommit(Conversation conversation, User sender, User recipient) {
        ConversationContext context = resolveContext(conversation);
        NewMessageNotification notification = new NewMessageNotification(
                conversation.getId(),
                recipient.getId(),
                recipient.getEmail(),
                recipient.getFirstName(),
                sender.getFirstName() + " " + sender.getLastName(),
                context.route(),
                buildConversationUrl(conversation.getId())
        );

        runAfterCommit(() -> notifyRecipient(notification));
    }

    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
            return;
        }

        action.run();
    }

    private void notifyRecipient(NewMessageNotification notification) {
        if (!notificationThrottle.tryAcquire(notification.conversationId(), notification.recipientId())) {
            return;
        }

        try {
            emailService.sendNewMessageEmail(
                    notification.recipientEmail(),
                    notification.recipientFirstName(),
                    notification.senderName(),
                    notification.route(),
                    notification.conversationUrl()
            );
        } catch (RuntimeException ex) {
            notificationThrottle.release(notification.conversationId(), notification.recipientId());
            log.warn("Unable to send new-message notification for conversation {}", notification.conversationId(), ex);
        }
    }

    private String buildConversationUrl(Long conversationId) {
        String baseUrl = (frontendBaseUrl == null || frontendBaseUrl.isBlank())
                ? "http://localhost:4200"
                : frontendBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "/messages?conversationId=" + conversationId;
    }

    /**
     * Builds a {@link ConversationResponse} for the given conversation
     * from the perspective of the current user.
     */
    private ConversationResponse toConversationResponse(Conversation conversation, User currentUser) {
        User otherParticipant = getOtherParticipant(conversation, currentUser);

        String lastMessageContent = messageRepository
                .findTopByConversationOrderBySentAtDesc(conversation)
                .map(Message::getContent)
                .orElse(null);

        long unreadCount = messageRepository
                .countByConversationAndReadFalseAndSenderNot(conversation, currentUser);

        ConversationContext context = resolveContext(conversation);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .tripId(context.trip() != null ? context.trip().getId() : null)
                .tripRoute(context.trip() != null ? context.route() : null)
                .contextType(context.type())
                .contextId(context.id())
                .contextRoute(context.route())
                .otherParticipantId(otherParticipant.getId())
                .otherParticipantName(otherParticipant.getFirstName() + " " + otherParticipant.getLastName())
                .lastMessage(lastMessageContent)
                .unreadCount(unreadCount)
                .createdAt(conversation.getCreatedAt())
                .build();
    }

    private ConversationContext resolveContext(Long tripId, Long parcelRequestId) {
        if ((tripId == null) == (parcelRequestId == null)) {
            throw new BadRequestException(localizedMessages.get("error.messaging.invalidContext"));
        }
        if (tripId != null) {
            Trip trip = tripRepository.findById(tripId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            localizedMessages.get("error.trip.notFound", tripId)));
            return ConversationContext.forTrip(trip);
        }
        ParcelRequest parcelRequest = parcelRequestRepository.findById(parcelRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        localizedMessages.get("error.parcelRequest.notFound", parcelRequestId)));
        return ConversationContext.forParcelRequest(parcelRequest);
    }

    private ConversationContext resolveContext(Conversation conversation) {
        if (conversation.getTrip() != null) {
            return ConversationContext.forTrip(conversation.getTrip());
        }
        if (conversation.getParcelRequest() != null) {
            return ConversationContext.forParcelRequest(conversation.getParcelRequest());
        }
        throw new BadRequestException(localizedMessages.get("error.messaging.invalidContext"));
    }

    private record ConversationContext(String type, Long id, String route, Trip trip, ParcelRequest parcelRequest) {
        static ConversationContext forTrip(Trip trip) {
            return new ConversationContext(
                    "TRIP",
                    trip.getId(),
                    trip.getDepartureAddress() + " → " + trip.getDestination(),
                    trip,
                    null
            );
        }

        static ConversationContext forParcelRequest(ParcelRequest parcelRequest) {
            return new ConversationContext(
                    "PARCEL_REQUEST",
                    parcelRequest.getId(),
                    parcelRequest.getDeparture() + " → " + parcelRequest.getDestination(),
                    null,
                    parcelRequest
            );
        }
    }

    private record NewMessageNotification(Long conversationId,
                                          Long recipientId,
                                          String recipientEmail,
                                          String recipientFirstName,
                                          String senderName,
                                          String route,
                                          String conversationUrl) {
    }
}
