package com.coliclic.backoffice.messaging.service;

import com.coliclic.backoffice.messaging.dto.*;
import com.coliclic.backoffice.user.entity.User;

import java.util.List;

/**
 * Service interface for the messaging / chat system.
 */
public interface MessagingService {

    /**
     * Starts a new conversation or reuses an existing one for the same trip
     * and participants, then sends the first message.
     *
     * @param request     the start-conversation request
     * @param currentUser the authenticated user
     * @return the conversation overview
     */
    ConversationResponse startConversation(StartConversationRequest request, User currentUser);

    /**
     * Returns all conversations the current user is involved in.
     *
     * @param currentUser the authenticated user
     * @return list of conversations with last-message preview and unread count
     */
    List<ConversationResponse> getMyConversations(User currentUser);

    /**
     * Returns all messages in a conversation. Marks unread messages from
     * the other participant as read.
     *
     * @param conversationId the conversation ID
     * @param currentUser    the authenticated user
     * @return sorted list of messages
     */
    List<MessageResponse> getMessages(Long conversationId, User currentUser);

    /**
     * Sends a new message in an existing conversation.
     *
     * @param conversationId the conversation ID
     * @param request        the message request body
     * @param currentUser    the authenticated user
     * @return the created message
     */
    MessageResponse sendMessage(Long conversationId, SendMessageRequest request, User currentUser);

    /**
     * Creates a conversation (or reuses an existing one) without sending any message.
     * Used to open a messaging thread before the user composes their first message.
     *
     * @param request     the draft-conversation request
     * @param currentUser the authenticated user
     * @return the conversation overview
     */
    ConversationResponse createConversationDraft(CreateConversationDraftRequest request, User currentUser);
}
