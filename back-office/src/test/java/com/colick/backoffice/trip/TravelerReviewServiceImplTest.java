package com.colick.backoffice.trip;

import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.BadRequestException;
import com.colick.backoffice.exception.ReviewSubmissionConflictException;
import com.colick.backoffice.support.TestLocalizedMessages;
import com.colick.backoffice.trip.dto.SubmitTravelerReviewRequest;
import com.colick.backoffice.trip.dto.TravelerReviewResponse;
import com.colick.backoffice.trip.entity.TravelerReview;
import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.entity.TripBooking;
import com.colick.backoffice.trip.repository.TravelerReviewRepository;
import com.colick.backoffice.trip.repository.TripBookingRepository;
import com.colick.backoffice.trip.service.TravelerRatingSummary;
import com.colick.backoffice.trip.service.TravelerReviewServiceImpl;
import com.colick.backoffice.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.i18n.LocaleContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TravelerReviewServiceImplTest {

    @Mock
    private TripBookingRepository tripBookingRepository;

    @Mock
    private TravelerReviewRepository travelerReviewRepository;

    @Mock
    private EmailService emailService;

    private TravelerReviewServiceImpl travelerReviewService;

    private User traveler;
    private User sender;
    private Trip trip;
    private TripBooking acceptedBooking;

    @BeforeEach
    void setUp() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        travelerReviewService = new TravelerReviewServiceImpl(
                tripBookingRepository,
                travelerReviewRepository,
                emailService,
                "http://localhost:4200/traveler-review",
                TestLocalizedMessages.create()
        );

        traveler = User.builder()
                .id(1L)
                .firstName("Alice")
                .lastName("Dupont")
                .photoUrl("/uploads/alice.jpg")
                .email("alice@example.com")
                .build();

        sender = User.builder()
                .id(2L)
                .firstName("Bob")
                .lastName("Martin")
                .email("bob@example.com")
                .build();

        trip = Trip.builder()
                .id(10L)
                .traveler(traveler)
                .departureAddress("Paris")
                .destination("Abidjan")
                .departureTime(LocalDateTime.now().minusDays(1))
                .arrivalTime(LocalDateTime.now())
                .maxWeight(BigDecimal.TEN)
                .pricePerKilo(BigDecimal.ONE)
                .status(Trip.TripStatus.COMPLETED)
                .build();

        acceptedBooking = TripBooking.builder()
                .id(100L)
                .trip(trip)
                .sender(sender)
                .status(TripBooking.BookingStatus.ACCEPTED)
                .build();
    }

    @Test
    void createReviewInvitations_shouldCreateMissingInvitationsAndSendEmails() {
        when(tripBookingRepository.findByTripAndStatus(trip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of(acceptedBooking));
        when(travelerReviewRepository.findByBookingIn(anyCollection())).thenReturn(List.of());
        when(travelerReviewRepository.save(any(TravelerReview.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        travelerReviewService.createReviewInvitations(trip);

        ArgumentCaptor<TravelerReview> reviewCaptor = ArgumentCaptor.forClass(TravelerReview.class);
        verify(travelerReviewRepository).save(reviewCaptor.capture());
        assertThat(reviewCaptor.getValue().getBooking()).isEqualTo(acceptedBooking);
        assertThat(reviewCaptor.getValue().getTokenHash()).isNotBlank();
        assertThat(reviewCaptor.getValue().getInvitedAt()).isNotNull();

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendTravelerReviewInvitationEmail(
                eq(sender.getEmail()),
                eq(sender.getFirstName()),
                eq(traveler.getFirstName()),
                eq(trip.getDepartureAddress()),
                eq(trip.getDestination()),
                urlCaptor.capture()
        );
        assertThat(urlCaptor.getValue()).startsWith("http://localhost:4200/traveler-review?token=");
    }

    @Test
    void createReviewInvitations_shouldSkipBookingsThatAlreadyHaveAnInvitation() {
        TripBooking secondAcceptedBooking = TripBooking.builder()
                .id(101L)
                .trip(trip)
                .sender(User.builder().id(3L).firstName("Claire").email("claire@example.com").build())
                .status(TripBooking.BookingStatus.ACCEPTED)
                .build();
        TravelerReview existingReview = TravelerReview.builder()
                .id(1L)
                .booking(acceptedBooking)
                .tokenHash("existing")
                .invitedAt(LocalDateTime.now())
                .build();

        when(tripBookingRepository.findByTripAndStatus(trip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of(acceptedBooking, secondAcceptedBooking));
        when(travelerReviewRepository.findByBookingIn(anyCollection())).thenReturn(List.of(existingReview));
        when(travelerReviewRepository.save(any(TravelerReview.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        travelerReviewService.createReviewInvitations(trip);

        verify(travelerReviewRepository, times(1)).save(any(TravelerReview.class));
        verify(emailService, times(1)).sendTravelerReviewInvitationEmail(
                eq("claire@example.com"),
                eq("Claire"),
                eq(traveler.getFirstName()),
                eq(trip.getDepartureAddress()),
                eq(trip.getDestination()),
                anyString()
        );
    }

    @Test
    void getReviewByToken_shouldReturnInvitationDetails() {
        TravelerReview review = TravelerReview.builder()
                .id(1L)
                .booking(acceptedBooking)
                .tokenHash("hash")
                .invitedAt(LocalDateTime.now())
                .build();
        when(travelerReviewRepository.findByTokenHashWithAssociations(anyString()))
                .thenReturn(Optional.of(review));

        TravelerReviewResponse response = travelerReviewService.getReviewByToken("raw-token");

        assertThat(response.getBookingId()).isEqualTo(acceptedBooking.getId());
        assertThat(response.getTravelerName()).isEqualTo("Alice Dupont");
        assertThat(response.getTravelerPhotoUrl()).isEqualTo("/uploads/alice.jpg");
        assertThat(response.isSubmitted()).isFalse();
    }

    @Test
    void submitReview_shouldSaveFinalReview() {
        TravelerReview review = TravelerReview.builder()
                .id(1L)
                .booking(acceptedBooking)
                .tokenHash("hash")
                .invitedAt(LocalDateTime.now())
                .build();
        SubmitTravelerReviewRequest request = new SubmitTravelerReviewRequest();
        request.setRating(5);
        request.setComment("  Great traveler  ");

        when(travelerReviewRepository.findByTokenHashWithAssociations(anyString()))
                .thenReturn(Optional.of(review));
        when(travelerReviewRepository.save(review)).thenReturn(review);

        TravelerReviewResponse response = travelerReviewService.submitReview("raw-token", request);

        assertThat(review.getRating()).isEqualTo(5);
        assertThat(review.getComment()).isEqualTo("Great traveler");
        assertThat(review.getSubmittedAt()).isNotNull();
        assertThat(response.isSubmitted()).isTrue();
    }

    @Test
    void submitReview_shouldThrowConflict_whenReviewAlreadySubmitted() {
        TravelerReview review = TravelerReview.builder()
                .id(1L)
                .booking(acceptedBooking)
                .tokenHash("hash")
                .invitedAt(LocalDateTime.now().minusDays(1))
                .rating(4)
                .submittedAt(LocalDateTime.now())
                .build();
        SubmitTravelerReviewRequest request = new SubmitTravelerReviewRequest();
        request.setRating(5);

        when(travelerReviewRepository.findByTokenHashWithAssociations(anyString()))
                .thenReturn(Optional.of(review));

        assertThatThrownBy(() -> travelerReviewService.submitReview("raw-token", request))
                .isInstanceOf(ReviewSubmissionConflictException.class)
                .hasMessage("A final review has already been submitted for this booking");

        verify(travelerReviewRepository, never()).save(any());
    }

    @Test
    void getTravelerRatingSummaries_shouldMapRepositoryAggregates() {
        when(travelerReviewRepository.findRatingStatsByTravelerIds(List.of(1L, 2L)))
                .thenReturn(List.of(new TravelerRatingStatsProjectionStub(1L, 4.5, 2L)));

        Map<Long, TravelerRatingSummary> result = travelerReviewService.getTravelerRatingSummaries(List.of(1L, 2L));

        assertThat(result).containsKey(1L);
        assertThat(result.get(1L).averageRating()).isEqualTo(4.5);
        assertThat(result.get(1L).reviewCount()).isEqualTo(2L);
    }

    @Test
    void getReviewByToken_shouldThrow_whenTokenIsBlank() {
        assertThatThrownBy(() -> travelerReviewService.getReviewByToken(" "))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid traveler review token");
    }

    private static final class TravelerRatingStatsProjectionStub
            implements TravelerReviewRepository.TravelerRatingStatsProjection {

        private final Long travelerId;
        private final Double averageRating;
        private final long reviewCount;

        private TravelerRatingStatsProjectionStub(Long travelerId, Double averageRating, long reviewCount) {
            this.travelerId = travelerId;
            this.averageRating = averageRating;
            this.reviewCount = reviewCount;
        }

        @Override
        public Long getTravelerId() {
            return travelerId;
        }

        @Override
        public Double getAverageRating() {
            return averageRating;
        }

        @Override
        public long getReviewCount() {
            return reviewCount;
        }
    }
}
