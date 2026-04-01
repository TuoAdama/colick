package com.colick.backoffice.messaging.service;

import com.colick.backoffice.exception.ResourceNotFoundException;
import com.colick.backoffice.messaging.dto.*;
import com.colick.backoffice.messaging.entity.Conversation;
import com.colick.backoffice.messaging.entity.Message;
import com.colick.backoffice.messaging.repository.ConversationRepository;
import com.colick.backoffice.messaging.repository.MessageRepository;
import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.repository.TripRepository;
import com.colick.backoffice.user.entity.User;
import com.colick.backoffice.user.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of {@link MessagingService}.
 */
@Service
@Transactional
public class MessagingServiceImpl implements MessagingService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    public MessagingServiceImpl(ConversationRepository conversationRepository,
                                MessageRepository messageRepository,
                                TripRepository tripRepository,
                                UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ConversationResponse startConversation(StartConversationRequest request, User currentUser) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Trip not found with id: " + request.getTripId()));

        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + request.getRecipientId()));

        if (currentUser.getId().equals(recipient.getId())) {
            throw new IllegalArgumentException("Cannot start a conversation with yourself");
        }

        // Look for an existing conversation in both directions
        Conversation conversation = findExistingConversation(trip, currentUser, recipient)
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .trip(trip)
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

        return MessageResponse.from(messageRepository.save(message));
    }

    // ---- Private helpers ---------------------------------------------------

    /**
     * Finds an existing conversation for a trip between two users,
     * checking both orderings of participant1/participant2.
     */
    private Optional<Conversation> findExistingConversation(Trip trip, User userA, User userB) {
        return conversationRepository.findByTripAndParticipant1AndParticipant2(trip, userA, userB)
                .or(() -> conversationRepository.findByTripAndParticipant1AndParticipant2(trip, userB, userA));
    }

    private Conversation findConversationOrThrow(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Conversation not found with id: " + id));
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
            throw new AccessDeniedException("You are not a participant in this conversation");
        }
    }

    /**
     * Builds a {@link ConversationResponse} for the given conversation
     * from the perspective of the current user.
     */
    private ConversationResponse toConversationResponse(Conversation conversation, User currentUser) {
        User otherParticipant = conversation.getParticipant1().getId().equals(currentUser.getId())
                ? conversation.getParticipant2()
                : conversation.getParticipant1();

        String lastMessageContent = messageRepository
                .findTopByConversationOrderBySentAtDesc(conversation)
                .map(Message::getContent)
                .orElse(null);

        long unreadCount = messageRepository
                .countByConversationAndReadFalseAndSenderNot(conversation, currentUser);

        Trip trip = conversation.getTrip();

        return ConversationResponse.builder()
                .id(conversation.getId())
                .tripId(trip.getId())
                .tripRoute(trip.getDepartureAddress() + " → " + trip.getDestination())
                .otherParticipantId(otherParticipant.getId())
                .otherParticipantName(otherParticipant.getFirstName() + " " + otherParticipant.getLastName())
                .lastMessage(lastMessageContent)
                .unreadCount(unreadCount)
                .createdAt(conversation.getCreatedAt())
                .build();
    }
}
