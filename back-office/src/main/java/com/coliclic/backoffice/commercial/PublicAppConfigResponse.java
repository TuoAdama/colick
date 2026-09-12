package com.coliclic.backoffice.commercial;

import java.math.BigDecimal;

/** Public, non-sensitive application configuration consumed by the front-office. */
public record PublicAppConfigResponse(
        CommercialMode commercialMode,
        BigDecimal platformFeeRate,
        Features features,
        String contentVariant
) {
    public record Features(boolean platformPayment, boolean platformFee) {
    }

    public static PublicAppConfigResponse from(CommercialProperties properties) {
        CommercialMode mode = properties.getMode();
        return new PublicAppConfigResponse(
                mode,
                mode.getPlatformFeeRate(),
                new Features(mode.isPlatformPaymentEnabled(), mode.isPlatformFeeEnabled()),
                mode.getContentVariant()
        );
    }
}
