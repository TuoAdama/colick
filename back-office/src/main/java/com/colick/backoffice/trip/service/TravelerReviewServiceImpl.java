package com.colick.backoffice.trip.service;

import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.BadRequestException;
import com.colick.backoffice.exception.ReviewSubmissionConflictException;
import com.colick.backoffice.i18n.LocalizedMessages;
import com.colick.backoffice.trip.dto.SubmitTravelerReviewRequest;
import com.colick.backoffice.trip.dto.TravelerReviewResponse;
import com.colick.backoffice.trip.dto.TripBookingSenderReviewResponse;
import com.colick.backoffice.trip.entity.TravelerReview;
import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.entity.TripBooking;
import com.colick.backoffice.trip.repository.TravelerReviewRepository;
import com.colick.backoffice.trip.repository.TripBookingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Default implementation of traveler review invitation and submission flows.
 */
@Service
@Transactional
public class TravelerReviewServiceImpl implements TravelerReviewService {

    private final TripBookingRepository tripBookingRepository;
    private final TravelerReviewRepository travelerReviewRepository;
    private final EmailService emailService;
    private final String reviewBaseUrl;
    private final LocalizedMessages localizedMessages;

    public TravelerReviewServiceImpl(TripBookingRepository tripBookingRepository,
                                     TravelerReviewRepository travelerReviewRepository,
                                     EmailService emailService,
                                     @Value("${app.review.base-url}") String reviewBaseUrl,
                                     LocalizedMessages localizedMessages) {
        this.tripBookingRepository = tripBookingRepository;
        this.travelerReviewRepository = travelerReviewRepository;
        this.emailService = emailService;
        this.reviewBaseUrl = reviewBaseUrl;
        this.localizedMessages = localizedMessages;
    }

    @Override
    public void createReviewInvitations(Trip trip) {
        List<TripBooking> acceptedBookings = tripBookingRepository.findByTripAndStatus(
                trip, TripBooking.BookingStatus.ACCEPTED);

        if (acceptedBookings.isEmpty()) {
            return;
        }

        Set<Long> existingBookingIds = travelerReviewRepository.findByBookingIn(acceptedBookings).stream()
                .map(review -> review.getBooking().getId())
                .collect(Collectors.toSet());

        for (TripBooking booking : acceptedBookings) {
            if (existingBookingIds.contains(booking.getId())) {
                continue;
            }

            String rawToken = generateToken();
            TravelerReview review = TravelerReview.builder()
                    .booking(booking)
                    .tokenHash(hashToken(rawToken))
                    .invitedAt(LocalDateTime.now())
                    .build();
            travelerReviewRepository.save(review);

            emailService.sendTravelerReviewInvitationEmail(
                    booking.getSender().getEmail(),
                    booking.getSender().getFirstName(),
                    trip.getTraveler().getFirstName(),
                    trip.getDepartureAddress(),
                    trip.getDestination(),
                    buildReviewUrl(rawToken)
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TravelerReviewResponse getReviewByToken(String rawToken) {
        return TravelerReviewResponse.from(findReviewByRawToken(rawToken));
    }

    @Override
    public TravelerReviewResponse submitReview(String rawToken, SubmitTravelerReviewRequest request) {
        TravelerReview review = findReviewByRawToken(rawToken);

        if (review.isSubmitted()) {
            throw new ReviewSubmissionConflictException(localizedMessages.get("error.review.alreadySubmitted"));
        }

        review.submit(request.getRating(), request.getComment(), LocalDateTime.now());

        return TravelerReviewResponse.from(travelerReviewRepository.save(review));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, TravelerRatingSummary> getTravelerRatingSummaries(Collection<Long> travelerIds) {
        if (travelerIds == null || travelerIds.isEmpty()) {
            return Map.of();
        }

        return travelerReviewRepository.findRatingStatsByTravelerIds(travelerIds).stream()
                .collect(Collectors.toMap(
                        TravelerReviewRepository.TravelerRatingStatsProjection::getTravelerId,
                        projection -> new TravelerRatingSummary(
                                projection.getAverageRating(),
                                projection.getReviewCount()
                        )
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TripBookingSenderReviewResponse> getSubmittedReviewsForTraveler(Long travelerId) {
        if (travelerId == null) {
            return List.of();
        }

        return travelerReviewRepository.findSubmittedReviewsByTravelerId(travelerId).stream()
                .map(TripBookingSenderReviewResponse::from)
                .toList();
    }

    private TravelerReview findReviewByRawToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadRequestException(localizedMessages.get("error.review.invalidToken"));
        }
        return travelerReviewRepository.findByTokenHashWithAssociations(hashToken(rawToken))
                .orElseThrow(() -> new BadRequestException(localizedMessages.get("error.review.invalidToken")));
    }

    private String buildReviewUrl(String rawToken) {
        String baseUrl = reviewBaseUrl == null ? "" : reviewBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "?token=" + rawToken;
    }

    private String generateToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(localizedMessages.get("error.system.sha256Unavailable"), e);
        }
    }
}
