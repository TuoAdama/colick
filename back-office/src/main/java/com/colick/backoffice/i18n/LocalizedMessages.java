package com.colick.backoffice.i18n;

import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;

@Component
public class LocalizedMessages {

    private final MessageSource messageSource;

    public LocalizedMessages(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public String get(String code, Object... args) {
        return getForLocale(LocaleContextHolder.getLocale(), code, args);
    }

    public String getForLocale(Locale locale, String code, Object... args) {
        return messageSource.getMessage(code, args, locale);
    }
}
