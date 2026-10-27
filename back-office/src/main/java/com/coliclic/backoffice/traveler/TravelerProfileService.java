package com.coliclic.backoffice.traveler;

import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.messaging.entity.Message;
import com.coliclic.backoffice.messaging.repository.MessageRepository;
import com.coliclic.backoffice.traveler.dto.*;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TravelerReviewRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.service.TravelerRatingSummary;
import com.coliclic.backoffice.trip.service.TravelerReviewService;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class TravelerProfileService {
    private static final int MINIMUM_RESPONSE_SAMPLE = 3;
    private static final int RESPONSE_WINDOW_DAYS = 90;

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final TravelerReviewRepository reviewRepository;
    private final TravelerReviewService reviewService;
    private final MessageRepository messageRepository;

    public TravelerProfileService(UserRepository userRepository,
                                  TripRepository tripRepository,
                                  TravelerReviewRepository reviewRepository,
                                  TravelerReviewService reviewService,
                                  MessageRepository messageRepository) {
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.reviewRepository = reviewRepository;
        this.reviewService = reviewService;
        this.messageRepository = messageRepository;
    }

    public TravelerProfileResponse getProfile(Long travelerId) {
        User traveler = findPublicTraveler(travelerId);
        TravelerRatingSummary rating = reviewService.getTravelerRatingSummaries(Set.of(travelerId)).get(travelerId);
        TravelerResponseMetrics responsiveness = calculateResponsiveness(travelerId, LocalDateTime.now().minusDays(RESPONSE_WINDOW_DAYS));
        return new TravelerProfileResponse(
                traveler.getId(),
                traveler.getFirstName() + " " + traveler.getLastName(),
                traveler.getPhotoUrl(),
                traveler.getEmailVerifiedAt() != null,
                traveler.getCreatedAt(),
                traveler.isCreatedAtEstimated(),
                tripRepository.countByTravelerAndStatus(traveler, Trip.TripStatus.COMPLETED),
                rating == null ? null : rating.averageRating(),
                rating == null ? 0 : rating.reviewCount(),
                responsiveness.responseRatePercent(),
                responsiveness.averageResponseTimeMinutes(),
                responsiveness.responseSampleSize()
        );
    }

    public TravelerReviewsPageResponse getReviews(Long travelerId, int page, int size) {
        findPublicTraveler(travelerId);
        int safePage = Math.max(0, page);
        int safeSize = Math.min(50, Math.max(1, size));
        var result = reviewRepository.findSubmittedReviewsPageByTravelerId(
                travelerId, PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "submittedAt")));
        return new TravelerReviewsPageResponse(
                result.getContent().stream().map(PublicTravelerReviewResponse::from).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    TravelerResponseMetrics calculateResponsiveness(Long travelerId, LocalDateTime since) {
        Map<Long, List<Message>> byConversation = new LinkedHashMap<>();
        for (Message message : messageRepository.findTripConversationMessagesForTraveler(travelerId)) {
            byConversation.computeIfAbsent(message.getConversation().getId(), ignored -> new ArrayList<>()).add(message);
        }

        long eligible = 0;
        long answered = 0;
        long totalDelayMinutes = 0;
        for (List<Message> messages : byConversation.values()) {
            if (messages.isEmpty()) continue;
            Message first = messages.getFirst();
            if (first.getSentAt().isBefore(since) || first.getSender().getId().equals(travelerId)) continue;
            eligible++;
            Optional<Message> response = messages.stream().skip(1)
                    .filter(message -> message.getSender().getId().equals(travelerId))
                    .findFirst();
            if (response.isPresent()) {
                answered++;
                totalDelayMinutes += Math.max(0, Duration.between(first.getSentAt(), response.get().getSentAt()).toMinutes());
            }
        }
        if (eligible < MINIMUM_RESPONSE_SAMPLE) return TravelerResponseMetrics.insufficient(eligible);
        long rate = Math.round(answered * 100.0 / eligible);
        Long average = answered == 0 ? null : Math.round(totalDelayMinutes * 1.0 / answered);
        return new TravelerResponseMetrics(rate, average, eligible);
    }

    private User findPublicTraveler(Long travelerId) {
        User traveler = userRepository.findById(travelerId)
                .orElseThrow(() -> new ResourceNotFoundException("Profil voyageur introuvable."));
        if (!tripRepository.existsByTravelerAndStatusIn(
                traveler, List.of(Trip.TripStatus.ACTIVE, Trip.TripStatus.COMPLETED))) {
            throw new ResourceNotFoundException("Profil voyageur introuvable.");
        }
        return traveler;
    }
}
