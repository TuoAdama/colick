package com.coliclic.backoffice.user.service;

import com.coliclic.backoffice.messaging.repository.ConversationRepository;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.stream.Stream;

/** Idempotently reconstructs only trust data that existing records can prove. */
@Component
public class UserTrustBackfillRunner implements ApplicationRunner {
    private final UserRepository users;
    private final TripRepository trips;
    private final TripBookingRepository bookings;
    private final ConversationRepository conversations;

    public UserTrustBackfillRunner(UserRepository users, TripRepository trips,
                                   TripBookingRepository bookings, ConversationRepository conversations) {
        this.users = users;
        this.trips = trips;
        this.bookings = bookings;
        this.conversations = conversations;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (User user : users.findAll()) {
            boolean changed = false;
            if (user.getCreatedAt() == null) {
                LocalDateTime earliest = Stream.of(
                                trips.findFirstByTravelerAndCreatedAtIsNotNullOrderByCreatedAtAsc(user)
                                        .map(trip -> trip.getCreatedAt()).orElse(null),
                                bookings.findFirstBySenderAndCreatedAtIsNotNullOrderByCreatedAtAsc(user)
                                        .map(booking -> booking.getCreatedAt()).orElse(null),
                                conversations.findEarliestCreatedAtForUser(user).orElse(null))
                        .filter(Objects::nonNull).min(LocalDateTime::compareTo).orElse(null);
                if (earliest != null) {
                    user.setCreatedAt(earliest);
                    user.setCreatedAtEstimated(true);
                    changed = true;
                }
            }
            boolean verificationIsProvable = Boolean.TRUE.equals(user.getEnabled())
                    && (user.getGoogleSubject() != null || user.getSignupConfirmToken() == null);
            if (user.getEmailVerifiedAt() == null && verificationIsProvable) {
                user.setEmailVerifiedAt(LocalDateTime.now());
                changed = true;
            }
            if (changed) users.save(user);
        }
    }
}
