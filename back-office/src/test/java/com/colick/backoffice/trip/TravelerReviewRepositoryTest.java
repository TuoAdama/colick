package com.colick.backoffice.trip;

import com.colick.backoffice.trip.entity.TravelerReview;
import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.entity.TripBooking;
import com.colick.backoffice.trip.repository.TravelerReviewRepository;
import com.colick.backoffice.trip.repository.TripBookingRepository;
import com.colick.backoffice.trip.repository.TripRepository;
import com.colick.backoffice.user.entity.User;
import com.colick.backoffice.user.repository.UserRepository;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
@TestPropertySource(properties = "spring.sql.init.mode=never")
class TravelerReviewRepositoryTest {

    @Autowired
    private TravelerReviewRepository travelerReviewRepository;

    @Autowired
    private TripBookingRepository tripBookingRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByTokenHashWithAssociations_shouldReturnReviewWithTripData() {
        PersistedBooking persistedBooking = persistAcceptedBooking("token-review@example.com");
        TravelerReview savedReview = travelerReviewRepository.saveAndFlush(buildInvitation(persistedBooking.booking(), "a".repeat(64)));

        TravelerReview foundReview = travelerReviewRepository.findByTokenHashWithAssociations("a".repeat(64))
                .orElseThrow();

        assertThat(foundReview.getId()).isEqualTo(savedReview.getId());
        assertThat(foundReview.getBooking().getId()).isEqualTo(persistedBooking.booking().getId());
        assertThat(foundReview.getBooking().getTrip().getTraveler().getId()).isEqualTo(persistedBooking.trip().getTraveler().getId());
    }

    @Test
    void save_shouldRejectSecondReviewForSameBooking() {
        PersistedBooking persistedBooking = persistAcceptedBooking("duplicate-review@example.com");
        travelerReviewRepository.saveAndFlush(buildInvitation(persistedBooking.booking(), "b".repeat(64)));

        TravelerReview duplicateReview = buildInvitation(persistedBooking.booking(), "c".repeat(64));

        assertThatThrownBy(() -> travelerReviewRepository.saveAndFlush(duplicateReview))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_shouldRejectRatingOutsideAllowedRange() {
        PersistedBooking persistedBooking = persistAcceptedBooking("invalid-rating@example.com");
        TravelerReview invalidReview = TravelerReview.builder()
                .booking(persistedBooking.booking())
                .tokenHash("d".repeat(64))
                .invitedAt(LocalDateTime.now().minusHours(1))
                .rating(6)
                .submittedAt(LocalDateTime.now())
                .build();

        assertThatThrownBy(() -> travelerReviewRepository.saveAndFlush(invalidReview))
                .isInstanceOf(ConstraintViolationException.class);
    }

    @Test
    void findRatingStatsByTravelerIds_shouldOnlyIncludeSubmittedReviews() {
        User traveler = persistTraveler("shared-traveler@example.com", "TRAVELER-SHARED");

        PersistedBooking firstBooking = persistAcceptedBooking(traveler, "summary-one@example.com");
        PersistedBooking secondBooking = persistAcceptedBooking(traveler, "summary-two@example.com");
        PersistedBooking thirdBooking = persistAcceptedBooking(traveler, "summary-three@example.com");

        TravelerReview firstReview = buildInvitation(firstBooking.booking(), "e".repeat(64));
        firstReview.submit(4, "Reliable", LocalDateTime.now());
        travelerReviewRepository.save(firstReview);

        TravelerReview secondReview = buildInvitation(secondBooking.booking(), "f".repeat(64));
        secondReview.submit(2, "Late", LocalDateTime.now());
        travelerReviewRepository.save(secondReview);

        travelerReviewRepository.saveAndFlush(buildInvitation(thirdBooking.booking(), "1".repeat(64)));

        List<TravelerReviewRepository.TravelerRatingStatsProjection> stats =
                travelerReviewRepository.findRatingStatsByTravelerIds(List.of(traveler.getId()));

        assertThat(stats).hasSize(1);
        assertThat(stats.get(0).getTravelerId()).isEqualTo(traveler.getId());
        assertThat(stats.get(0).getReviewCount()).isEqualTo(2);
        assertThat(stats.get(0).getAverageRating()).isEqualTo(3.0d);
    }

    private TravelerReview buildInvitation(TripBooking booking, String tokenHash) {
        return TravelerReview.builder()
                .booking(booking)
                .tokenHash(tokenHash)
                .invitedAt(LocalDateTime.now().minusHours(1))
                .build();
    }

    private PersistedBooking persistAcceptedBooking(String senderEmail) {
        User traveler = persistTraveler("traveler-" + senderEmail, "TRAVELER-" + senderEmail);
        return persistAcceptedBooking(traveler, senderEmail);
    }

    private PersistedBooking persistAcceptedBooking(User traveler, String senderEmail) {
        User sender = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Sender")
                .email(senderEmail)
                .identityDocument("SENDER-" + senderEmail)
                .password("hashed-password")
                .enabled(true)
                .role(User.Role.USER)
                .build());

        Trip trip = tripRepository.save(Trip.builder()
                .traveler(traveler)
                .departureAddress("Paris")
                .destination("Abidjan")
                .departureTime(LocalDateTime.now().plusDays(1))
                .arrivalTime(LocalDateTime.now().plusDays(2))
                .maxWeight(BigDecimal.TEN)
                .pricePerKilo(BigDecimal.ONE)
                .status(Trip.TripStatus.COMPLETED)
                .build());

        TripBooking booking = tripBookingRepository.save(TripBooking.builder()
                .trip(trip)
                .sender(sender)
                .title("Parcel")
                .recipientContact("+22500000000")
                .status(TripBooking.BookingStatus.ACCEPTED)
                .build());

        return new PersistedBooking(trip, booking);
    }

    private User persistTraveler(String email, String identityDocument) {
        return userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Traveler")
                .email(email)
                .identityDocument(identityDocument)
                .password("hashed-password")
                .enabled(true)
                .role(User.Role.USER)
                .build());
    }

    private record PersistedBooking(Trip trip, TripBooking booking) {
    }
}
