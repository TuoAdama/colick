package com.coliclic.backoffice.traveler.dto;

import java.util.List;

public record TravelerReviewsPageResponse(
        List<PublicTravelerReviewResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
