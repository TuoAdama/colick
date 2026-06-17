package com.colick.backoffice.messaging.service;

import com.colick.backoffice.exception.BadRequestException;
import com.colick.backoffice.exception.ResourceNotFoundException;
import com.colick.backoffice.i18n.LocalizedMessages;
import com.colick.backoffice.messaging.dto.*;
import com.colick.backoffice.messaging.entity.Conversation;
import com.colick.backoffice.messaging.entity.Message;
import com.colick.backoffice.messaging.repository.ConversationRepository;
import com.colick.backoffice.messaging.repository.MessageRepository;
import com.colick.backoffice.parcelrequest.entity.ParcelRequest;
import com.colick.backoffice.parcelrequest.repository.ParcelRequestRepository;
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
    private final ParcelRequestRepository parcelRequestRepository;
    private final UserRepository userRepository;
    private final LocalizedMessages localizedMessages;

    public MessagingServiceImpl(ConversationRepository conversationRepository,
                                MessageRepository messageRepository,
                                TripRepository tripRepository,
                                ParcelRequestRepository parcelRequestRepository,
                                UserRepository userRepository,
                                LocalizedMessages localizedMessages) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.tripRepository = tripRepository;
        this.parcelRequestRepository = parcelRequestRepository;
        this.userRepository = userRepository;
        this.localizedMessages = localizedMessages;
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
}
