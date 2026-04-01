package com.colick.backoffice.messaging.service;

import com.colick.backoffice.messaging.dto.*;
import com.colick.backoffice.user.entity.User;

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
}
