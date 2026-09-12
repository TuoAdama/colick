package com.coliclic.backoffice.commercial;

import java.math.BigDecimal;

/** Commercial operating modes supported by Coliclic. */
public enum CommercialMode {
    FREE(BigDecimal.ZERO, false, false, "free"),
    COMMISSION(new BigDecimal("0.07"), true, true, "commission");

    private final BigDecimal platformFeeRate;
    private final boolean platformPaymentEnabled;
    private final boolean platformFeeEnabled;
    private final String contentVariant;

    CommercialMode(BigDecimal platformFeeRate,
                   boolean platformPaymentEnabled,
                   boolean platformFeeEnabled,
                   String contentVariant) {
        this.platformFeeRate = platformFeeRate;
        this.platformPaymentEnabled = platformPaymentEnabled;
        this.platformFeeEnabled = platformFeeEnabled;
        this.contentVariant = contentVariant;
    }

    public BigDecimal getPlatformFeeRate() {
        return platformFeeRate;
    }

    public boolean isPlatformPaymentEnabled() {
        return platformPaymentEnabled;
    }

    public boolean isPlatformFeeEnabled() {
        return platformFeeEnabled;
    }

    public String getContentVariant() {
        return contentVariant;
    }
}
