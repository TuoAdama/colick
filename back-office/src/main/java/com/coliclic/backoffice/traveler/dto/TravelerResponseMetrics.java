package com.coliclic.backoffice.traveler.dto;

public record TravelerResponseMetrics(
        Long responseRatePercent,
        Long averageResponseTimeMinutes,
        long responseSampleSize
) {
    public static TravelerResponseMetrics insufficient(long sampleSize) {
        return new TravelerResponseMetrics(null, null, sampleSize);
    }
}
