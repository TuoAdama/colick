package com.colick.backoffice.trip.service;

import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.ValidationCodeDeliveryException;
import com.colick.backoffice.notification.qrcode.QrCodeService;
import com.colick.backoffice.notification.sms.SmsService;
import com.colick.backoffice.trip.entity.TripBooking;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class BookingValidationService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PHONE_ALLOWED_PATTERN = Pattern.compile("^\\+?[0-9\\s().-]{6,}$");

    private final EmailService emailService;
    private final SmsService smsService;
    private final QrCodeService qrCodeService;
    private final SecureRandom secureRandom = new SecureRandom();

    public BookingValidationService(EmailService emailService,
                                    SmsService smsService,
                                    QrCodeService qrCodeService) {
        this.emailService = emailService;
        this.smsService = smsService;
        this.qrCodeService = qrCodeService;
    }

    public String normalizeRecipientContact(String rawContact) {
        if (rawContact == null) {
            throw new IllegalArgumentException("Recipient contact must be a valid email address or phone number");
        }

        String contact = rawContact.trim();
        if (contact.isEmpty()) {
            throw new IllegalArgumentException("Recipient contact must be a valid email address or phone number");
        }

        if (isEmail(contact)) {
            return contact.toLowerCase(Locale.ROOT);
        }

        if (!PHONE_ALLOWED_PATTERN.matcher(contact).matches()) {
            throw new IllegalArgumentException("Recipient contact must be a valid email address or phone number");
        }

        String normalizedPhone = contact.replaceAll("[\\s().-]", "");
        if (!normalizedPhone.matches("^\\+?[0-9]{6,15}$")) {
            throw new IllegalArgumentException("Recipient contact must be a valid email address or phone number");
        }
        return normalizedPhone;
    }

    public void sendValidationCode(TripBooking booking) {
        if (booking.hasActiveValidationCode()) {
            return;
        }

        String normalizedContact = normalizeRecipientContact(booking.getRecipientContact());
        TripBooking.ValidationDeliveryChannel channel = resolveDeliveryChannel(normalizedContact);
        String validationCode = "%06d".formatted(secureRandom.nextInt(1_000_000));

        try {
            if (channel == TripBooking.ValidationDeliveryChannel.EMAIL) {
                emailService.sendBookingValidationCodeEmail(
                        normalizedContact,
                        booking.getTitle(),
                        validationCode,
                        qrCodeService.generateDataUri(buildQrPayload(booking, validationCode)),
                        booking.getTrip().getDepartureAddress(),
                        booking.getTrip().getDestination()
                );
            } else {
                smsService.sendValidationCode(
                        normalizedContact,
                        validationCode,
                        booking.getTrip().getDepartureAddress(),
                        booking.getTrip().getDestination()
                );
            }
        } catch (RuntimeException ex) {
            throw new ValidationCodeDeliveryException(
                    "Unable to deliver validation code",
                    normalizedContact,
                    channel,
                    ex
            );
        }

        booking.setRecipientContact(normalizedContact);
        booking.setValidationCode(validationCode);
        booking.setValidationDeliveryChannel(channel);
        booking.setValidationDeliveryStatus(TripBooking.ValidationDeliveryStatus.DELIVERED);
        booking.setValidationCodeSentAt(LocalDateTime.now());
        booking.setValidationCodeInvalidatedAt(null);
        booking.setValidationCodeDeliveryFailedAt(null);
    }

    public void markValidationCodeDeliveryFailed(TripBooking booking,
                                                 String normalizedContact,
                                                 TripBooking.ValidationDeliveryChannel channel) {
        booking.setRecipientContact(normalizedContact);
        booking.setValidationCode(null);
        booking.setValidationDeliveryChannel(channel);
        booking.setValidationDeliveryStatus(TripBooking.ValidationDeliveryStatus.FAILED);
        booking.setValidationCodeSentAt(null);
        booking.setValidationCodeInvalidatedAt(null);
        booking.setValidationCodeDeliveryFailedAt(LocalDateTime.now());
    }

    public void invalidateValidationCode(TripBooking booking) {
        if (!booking.hasActiveValidationCode()) {
            return;
        }
        booking.setValidationDeliveryStatus(TripBooking.ValidationDeliveryStatus.INVALIDATED);
        booking.setValidationCodeInvalidatedAt(LocalDateTime.now());
    }

    private TripBooking.ValidationDeliveryChannel resolveDeliveryChannel(String normalizedContact) {
        return isEmail(normalizedContact)
                ? TripBooking.ValidationDeliveryChannel.EMAIL
                : TripBooking.ValidationDeliveryChannel.SMS;
    }

    private boolean isEmail(String contact) {
        return EMAIL_PATTERN.matcher(contact).matches();
    }

    private String buildQrPayload(TripBooking booking, String validationCode) {
        return "COLICK|BOOKING:%d|TRIP:%d|CODE:%s".formatted(
                booking.getId(),
                booking.getTrip().getId(),
                validationCode
        );
    }
}
