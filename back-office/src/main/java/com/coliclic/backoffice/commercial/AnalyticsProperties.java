package com.coliclic.backoffice.commercial;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Public analytics configuration. The measurement ID is intentionally safe to expose. */
@Component
@ConfigurationProperties(prefix = "app.analytics")
public class AnalyticsProperties {

    private String measurementId;

    public String getMeasurementId() {
        return measurementId;
    }

    public void setMeasurementId(String measurementId) {
        this.measurementId = measurementId == null || measurementId.isBlank()
                ? null
                : measurementId.trim();
    }
}
