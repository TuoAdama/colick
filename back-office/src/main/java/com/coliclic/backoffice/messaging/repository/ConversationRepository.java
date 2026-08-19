package com.coliclic.backoffice.messaging.repository;

import com.coliclic.backoffice.messaging.entity.Conversation;
import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link Conversation} entities.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Finds an existing conversation for a given trip between two specific participants.
     *
     * @param trip         the trip the conversation is about
     * @param participant1 one participant
     * @param participant2 the other participant
     * @return the conversation if it exists
     */
    Optional<Conversation> findByTripAndParticipant1AndParticipant2(Trip trip, User participant1, User participant2);

    Optional<Conversation> findByParcelRequestAndParticipant1AndParticipant2(
            ParcelRequest parcelRequest,
            User participant1,
            User participant2);

    /**
     * Finds all conversations where the given user is either participant1 or participant2.
     *
     * @param participant1 the user as participant1
     * @param participant2 the user as participant2 (same user reference)
     * @return all conversations involving the user
     */
    List<Conversation> findByParticipant1OrParticipant2(User participant1, User participant2);
}
