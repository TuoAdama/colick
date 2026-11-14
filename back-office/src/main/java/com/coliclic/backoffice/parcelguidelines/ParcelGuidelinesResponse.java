package com.coliclic.backoffice.parcelguidelines;

import java.util.List;

public record ParcelGuidelinesResponse(
        String version,
        List<String> prohibitedItems,
        List<String> packagingRecommendations,
        List<String> allowedPhotoContentTypes,
        long maxPhotoBytes
) {
    public static ParcelGuidelinesResponse current() {
        return new ParcelGuidelinesResponse(
                ParcelGuidelines.VERSION,
                ParcelGuidelines.PROHIBITED_ITEMS,
                ParcelGuidelines.PACKAGING_RECOMMENDATIONS,
                ParcelGuidelines.PHOTO_CONTENT_TYPES,
                ParcelGuidelines.MAX_PHOTO_BYTES
        );
    }
}
