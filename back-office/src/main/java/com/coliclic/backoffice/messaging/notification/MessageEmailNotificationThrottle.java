package com.coliclic.backoffice.messaging.notification;

/**
 * Limits new-message email notifications per conversation and recipient.
 */
public interface MessageEmailNotificationThrottle {

    /**
     * Attempts to reserve the current notification window.
     *
     * @return {@code true} when the email may be sent
     */
    boolean tryAcquire(Long conversationId, Long recipientId);

    /**
     * Clears the current notification window.
     */
    void release(Long conversationId, Long recipientId);
}
