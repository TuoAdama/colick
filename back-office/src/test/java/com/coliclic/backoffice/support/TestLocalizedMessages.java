package com.coliclic.backoffice.support;

import com.coliclic.backoffice.i18n.LocalizedMessages;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.nio.charset.StandardCharsets;

public final class TestLocalizedMessages {

    private TestLocalizedMessages() {
    }

    public static LocalizedMessages create() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        messageSource.setFallbackToSystemLocale(false);
        return new LocalizedMessages(messageSource);
    }
}
