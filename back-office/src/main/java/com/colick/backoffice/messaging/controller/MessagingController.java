package com.colick.backoffice.messaging.controller;

import com.colick.backoffice.messaging.dto.*;
import com.colick.backoffice.messaging.service.MessagingService;
import com.colick.backoffice.user.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the messaging / chat system.
 * All endpoints require authentication.
 */
@RestController
@RequestMapping("/messaging")
@PreAuthorize("isAuthenticated()")
public class MessagingController {

    private final MessagingService messagingService;

    public MessagingController(MessagingService messagingService) {
        this.messagingService = messagingService;
    }

    /**
     * Start a new conversation (or reuse an existing one) and send the first message.
     */
    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> startConversation(
            @Valid @RequestBody StartConversationRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messagingService.startConversation(request, currentUser));
    }

    /**
     * List all conversations for the currently authenticated user.
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getMyConversations(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(messagingService.getMyConversations(currentUser));
    }

    /**
     * Get all messages for a conversation. Marks unread messages as read.
     */
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(messagingService.getMessages(id, currentUser));
    }

    /**
     * Send a new message in an existing conversation.
     */
    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messagingService.sendMessage(id, request, currentUser));
    }
}
