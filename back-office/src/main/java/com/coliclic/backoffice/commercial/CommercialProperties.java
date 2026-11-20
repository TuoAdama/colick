package com.coliclic.backoffice.commercial;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Typed access to the active commercial profile. */
@Component
@ConfigurationProperties(prefix = "app.commercial")
public class CommercialProperties {

    private CommercialMode mode = CommercialMode.FREE;

    public CommercialMode getMode() {
        return mode;
    }

    public void setMode(CommercialMode mode) {
        this.mode = mode == null ? CommercialMode.FREE : mode;
    }

    @PostConstruct
    void validate() {
        if (mode == CommercialMode.FREE
                && (mode.getPlatformFeeRate().signum() != 0
                || mode.isPlatformFeeEnabled()
                || mode.isPlatformPaymentEnabled())) {
            throw new IllegalStateException("FREE commercial mode cannot enable platform fees or payments");
        }
    }
}
