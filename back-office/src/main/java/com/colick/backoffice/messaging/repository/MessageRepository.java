package com.colick.backoffice.messaging.repository;

import com.colick.backoffice.messaging.entity.Conversation;
import com.colick.backoffice.messaging.entity.Message;
import com.colick.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link Message} entities.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Returns all messages in a conversation, ordered by sent time ascending.
     *
     * @param conversation the conversation
     * @return sorted list of messages
     */
    List<Message> findByConversationOrderBySentAtAsc(Conversation conversation);

    /**
     * Counts unread messages in a conversation that were NOT sent by the given user.
     * This gives the unread count from the perspective of the given user.
     *
     * @param conversation the conversation
     * @param sender       the current user (messages from this user are excluded)
     * @return number of unread messages
     */
    long countByConversationAndReadFalseAndSenderNot(Conversation conversation, User sender);

    /**
     * Finds the most recent message in a conversation (for last-message preview).
     *
     * @param conversation the conversation
     * @return the latest message if any
     */
    Optional<Message> findTopByConversationOrderBySentAtDesc(Conversation conversation);

    /**
     * Finds all unread messages in a conversation that were NOT sent by the given user.
     * Used to mark messages as read when the user opens the conversation.
     *
     * @param conversation the conversation
     * @param sender       the sender to exclude (the current user)
     * @return unread messages from the other participant
     */
    List<Message> findByConversationAndReadFalseAndSenderNot(Conversation conversation, User sender);
}
