package com.coliclic.backoffice.commercial;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CommercialPropertiesTest {

    @Test
    void defaultsToFreeMode() {
        CommercialProperties properties = new CommercialProperties();

        assertThat(properties.getMode()).isEqualTo(CommercialMode.FREE);
        assertThat(properties.getMode().getPlatformFeeRate()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(properties.getMode().isPlatformPaymentEnabled()).isFalse();
    }

    @Test
    void bindsCommissionModeAndItsCapabilities() {
        CommercialProperties properties = new CommercialProperties();
        Binder binder = new Binder(new MapConfigurationPropertySource(
                Map.of("app.commercial.mode", "COMMISSION")));

        binder.bind("app.commercial", Bindable.ofInstance(properties));

        assertThat(properties.getMode()).isEqualTo(CommercialMode.COMMISSION);
        assertThat(properties.getMode().getPlatformFeeRate()).isEqualByComparingTo("0.07");
        assertThat(properties.getMode().isPlatformFeeEnabled()).isTrue();
        assertThat(properties.getMode().isPlatformPaymentEnabled()).isTrue();
    }

    @Test
    void freeProfileIsInternallyConsistent() {
        CommercialProperties properties = new CommercialProperties();

        properties.validate();

        assertThat(properties.getMode().getPlatformFeeRate()).isZero();
        assertThat(properties.getMode().isPlatformFeeEnabled()).isFalse();
    }

    @Test
    void publicResponseReflectsCommissionProfile() {
        CommercialProperties properties = new CommercialProperties();
        properties.setMode(CommercialMode.COMMISSION);

        PublicAppConfigResponse response = PublicAppConfigResponse.from(properties);

        assertThat(response.commercialMode()).isEqualTo(CommercialMode.COMMISSION);
        assertThat(response.platformFeeRate()).isEqualByComparingTo("0.07");
        assertThat(response.features().platformFee()).isTrue();
        assertThat(response.features().platformPayment()).isTrue();
        assertThat(response.contentVariant()).isEqualTo("commission");
    }
}
