package com.coliclic.backoffice.user;

import com.coliclic.backoffice.messaging.repository.ConversationRepository;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import com.coliclic.backoffice.user.service.UserTrustBackfillRunner;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserTrustBackfillRunnerTest {
    @Mock private UserRepository users;
    @Mock private TripRepository trips;
    @Mock private TripBookingRepository bookings;
    @Mock private ConversationRepository conversations;

    @Test
    void run_backfillsTheEarliestProvableDateAndIsIdempotent() {
        User user = User.builder().id(5L).enabled(false).createdAtEstimated(null).build();
        LocalDateTime tripDate = LocalDateTime.of(2024, 3, 10, 9, 0);
        LocalDateTime conversationDate = tripDate.minusDays(2);
        Trip trip = Trip.builder().createdAt(tripDate).build();
        when(users.findAll()).thenReturn(List.of(user));
        when(trips.findFirstByTravelerAndCreatedAtIsNotNullOrderByCreatedAtAsc(user))
                .thenReturn(Optional.of(trip));
        when(bookings.findFirstBySenderAndCreatedAtIsNotNullOrderByCreatedAtAsc(user))
                .thenReturn(Optional.empty());
        when(conversations.findEarliestCreatedAtForUser(user)).thenReturn(Optional.of(conversationDate));
        UserTrustBackfillRunner runner = new UserTrustBackfillRunner(users, trips, bookings, conversations);

        runner.run(new DefaultApplicationArguments(new String[0]));
        runner.run(new DefaultApplicationArguments(new String[0]));

        assertThat(user.getCreatedAt()).isEqualTo(conversationDate);
        assertThat(user.isCreatedAtEstimated()).isTrue();
        verify(users, times(1)).save(user);
        verify(trips, times(1)).findFirstByTravelerAndCreatedAtIsNotNullOrderByCreatedAtAsc(user);
    }

    @Test
    void run_initializesTheLegacyFlagWithoutInventingAnAccountDate() {
        User user = User.builder().id(6L).enabled(false).createdAtEstimated(null).build();
        when(users.findAll()).thenReturn(List.of(user));
        when(trips.findFirstByTravelerAndCreatedAtIsNotNullOrderByCreatedAtAsc(user)).thenReturn(Optional.empty());
        when(bookings.findFirstBySenderAndCreatedAtIsNotNullOrderByCreatedAtAsc(user)).thenReturn(Optional.empty());
        when(conversations.findEarliestCreatedAtForUser(user)).thenReturn(Optional.empty());

        new UserTrustBackfillRunner(users, trips, bookings, conversations)
                .run(new DefaultApplicationArguments(new String[0]));

        assertThat(user.getCreatedAt()).isNull();
        assertThat(user.isCreatedAtEstimated()).isFalse();
        verify(users).save(user);
    }
}
