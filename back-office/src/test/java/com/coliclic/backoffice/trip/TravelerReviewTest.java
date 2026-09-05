package com.coliclic.backoffice.trip;

import com.coliclic.backoffice.trip.entity.TravelerReview;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TravelerReviewTest {

    @Test
    void submit_shouldStoreFinalReviewData() {
        LocalDateTime now = LocalDateTime.now();
        TravelerReview review = TravelerReview.builder()
                .invitedAt(now.minusDays(1))
                .tokenHash("a".repeat(64))
                .build();

        review.submit(5, "  Great traveler  ", now);

        assertThat(review.isSubmitted()).isTrue();
        assertThat(review.getRating()).isEqualTo(5);
        assertThat(review.getComment()).isEqualTo("Great traveler");
        assertThat(review.getSubmittedAt()).isEqualTo(now);
    }

    @Test
    void submit_shouldRejectSecondSubmission() {
        LocalDateTime now = LocalDateTime.now();
        TravelerReview review = TravelerReview.builder()
                .invitedAt(now.minusDays(1))
                .tokenHash("b".repeat(64))
                .rating(4)
                .submittedAt(now.minusHours(1))
                .build();

        assertThatThrownBy(() -> review.submit(5, "Updated", now))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("A final review has already been submitted for this booking");
    }

    @Test
    void submit_shouldRejectRatingOutsideOneToFiveRange() {
        TravelerReview review = TravelerReview.builder()
                .invitedAt(LocalDateTime.now().minusDays(1))
                .tokenHash("c".repeat(64))
                .build();

        assertThatThrownBy(() -> review.submit(0, "Too low", LocalDateTime.now()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Rating must be between 1 and 5");
    }
}
