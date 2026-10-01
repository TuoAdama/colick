package com.coliclic.backoffice.traveler.dto;

import java.time.LocalDateTime;

public record TravelerProfileResponse(
        Long travelerId,
        String displayName,
        String photoUrl,
        boolean emailVerified,
        LocalDateTime memberSince,
        boolean memberSinceEstimated,
        long completedTripCount,
        Double averageRating,
        long reviewCount,
        Long responseRatePercent,
        Long averageResponseTimeMinutes,
        long responseSampleSize
) {
}
