package com.coliclic.backoffice.trip;

import com.coliclic.backoffice.email.EmailService;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ValidationCodeDeliveryException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.notification.qrcode.QrCodeService;
import com.coliclic.backoffice.notification.sms.SmsService;
import com.coliclic.backoffice.support.TestLocalizedMessages;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.service.BookingValidationService;
import com.coliclic.backoffice.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.i18n.LocaleContextHolder;

import java.time.LocalDateTime;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingValidationServiceTest {

    @Mock
    private EmailService emailService;

    @Mock
    private SmsService smsService;

    @Mock
    private QrCodeService qrCodeService;

    @Spy
    private LocalizedMessages localizedMessages = TestLocalizedMessages.create();

    @InjectMocks
    private BookingValidationService bookingValidationService;

    private Trip trip;

    @BeforeEach
    void setUp() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        User traveler = User.builder()
                .id(1L)
                .firstName("Alice")
                .lastName("Dupont")
                .email("alice@example.com")
                .role(User.Role.USER)
                .build();

        trip = Trip.builder()
                .id(10L)
                .traveler(traveler)
                .departureAddress("Paris")
                .destination("Abidjan")
                .departureTime(LocalDateTime.now().plusDays(5))
                .arrivalTime(LocalDateTime.now().plusDays(6))
                .build();
    }

    @Test
    void normalizeRecipientContact_shouldLowercaseEmail() {
        String normalized = bookingValidationService.normalizeRecipientContact(" Recipient@Example.COM ");

        assertThat(normalized).isEqualTo("recipient@example.com");
    }

    @Test
    void normalizeRecipientContact_shouldNormalizePhone() {
        String normalized = bookingValidationService.normalizeRecipientContact("+225 07 00-00-00");

        assertThat(normalized).isEqualTo("+22507000000");
    }

    @Test
    void normalizeRecipientContact_shouldThrow_whenInvalid() {
        assertThatThrownBy(() -> bookingValidationService.normalizeRecipientContact("John Doe"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Recipient contact must be a valid email address or phone number");
    }

    @Test
    void sendValidationCode_shouldSendEmailAndStoreMetadata_forEmailContact() {
        TripBooking booking = TripBooking.builder()
                .id(20L)
                .trip(trip)
                .title("Documents")
                .recipientContact("Recipient@Example.com")
                .status(TripBooking.BookingStatus.ACCEPTED)
                .build();

        when(qrCodeService.generateDataUri(anyString())).thenReturn("data:image/png;base64,qr");

        bookingValidationService.sendValidationCode(booking);

        assertThat(booking.getRecipientContact()).isEqualTo("recipient@example.com");
        assertThat(booking.getValidationDeliveryChannel()).isEqualTo(TripBooking.ValidationDeliveryChannel.EMAIL);
        assertThat(booking.getValidationDeliveryStatus()).isEqualTo(TripBooking.ValidationDeliveryStatus.DELIVERED);
        assertThat(booking.getValidationCode()).matches("\\d{6}");
        assertThat(booking.getValidationCodeSentAt()).isNotNull();
        assertThat(booking.getValidationCodeDeliveryFailedAt()).isNull();
        assertThat(booking.getValidationCodeInvalidatedAt()).isNull();

        ArgumentCaptor<String> qrPayloadCaptor = ArgumentCaptor.forClass(String.class);
        verify(qrCodeService).generateDataUri(qrPayloadCaptor.capture());
        assertThat(qrPayloadCaptor.getValue())
                .contains("BOOKING:20")
                .contains("TRIP:10")
                .contains("CODE:" + booking.getValidationCode());
        verify(emailService).sendBookingValidationCodeEmail(
                eq("recipient@example.com"),
                eq("Documents"),
                eq(booking.getValidationCode()),
                eq("data:image/png;base64,qr"),
                eq("Paris"),
                eq("Abidjan"));
        verifyNoInteractions(smsService);
    }

    @Test
    void sendValidationCode_shouldSendSmsAndStoreMetadata_forPhoneContact() {
        TripBooking booking = TripBooking.builder()
                .id(21L)
                .trip(trip)
                .title("Valise")
                .recipientContact("+225 07 00 00 00")
                .status(TripBooking.BookingStatus.ACCEPTED)
                .build();

        bookingValidationService.sendValidationCode(booking);

        assertThat(booking.getRecipientContact()).isEqualTo("+22507000000");
        assertThat(booking.getValidationDeliveryChannel()).isEqualTo(TripBooking.ValidationDeliveryChannel.SMS);
        assertThat(booking.getValidationDeliveryStatus()).isEqualTo(TripBooking.ValidationDeliveryStatus.DELIVERED);
        assertThat(booking.getValidationCode()).matches("\\d{6}");
        assertThat(booking.getValidationCodeSentAt()).isNotNull();
        verify(smsService).sendValidationCode(
                eq("+22507000000"),
                eq(booking.getValidationCode()),
                eq("Paris"),
                eq("Abidjan"));
        verifyNoInteractions(emailService);
        verifyNoInteractions(qrCodeService);
    }

    @Test
    void sendValidationCode_shouldThrowDeliveryException_whenSmsSendFails() {
        TripBooking booking = TripBooking.builder()
                .id(21L)
                .trip(trip)
                .title("Valise")
                .recipientContact("+225 07 00 00 00")
                .status(TripBooking.BookingStatus.ACCEPTED)
                .build();

        doThrow(new IllegalStateException("SMS delivery is not configured"))
                .when(smsService).sendValidationCode(anyString(), anyString(), anyString(), anyString());

        assertThatThrownBy(() -> bookingValidationService.sendValidationCode(booking))
                .isInstanceOf(ValidationCodeDeliveryException.class)
                .hasMessage("Unable to deliver validation code");

        assertThat(booking.getValidationCode()).isNull();
        assertThat(booking.getValidationDeliveryStatus()).isNull();
        assertThat(booking.getValidationCodeSentAt()).isNull();
    }

    @Test
    void markValidationCodeDeliveryFailed_shouldPersistFailureMetadata() {
        TripBooking booking = TripBooking.builder()
                .trip(trip)
                .recipientContact("+22507000000")
                .build();

        bookingValidationService.markValidationCodeDeliveryFailed(
                booking,
                "+22507000000",
                TripBooking.ValidationDeliveryChannel.SMS
        );

        assertThat(booking.getRecipientContact()).isEqualTo("+22507000000");
        assertThat(booking.getValidationCode()).isNull();
        assertThat(booking.getValidationDeliveryChannel()).isEqualTo(TripBooking.ValidationDeliveryChannel.SMS);
        assertThat(booking.getValidationDeliveryStatus()).isEqualTo(TripBooking.ValidationDeliveryStatus.FAILED);
        assertThat(booking.getValidationCodeDeliveryFailedAt()).isNotNull();
    }

    @Test
    void invalidateValidationCode_shouldSetInvalidatedAt_whenCodeIsActive() {
        TripBooking booking = TripBooking.builder()
                .trip(trip)
                .recipientContact("recipient@example.com")
                .validationCode("123456")
                .validationDeliveryStatus(TripBooking.ValidationDeliveryStatus.DELIVERED)
                .validationCodeSentAt(LocalDateTime.now())
                .build();

        bookingValidationService.invalidateValidationCode(booking);

        assertThat(booking.getValidationDeliveryStatus()).isEqualTo(TripBooking.ValidationDeliveryStatus.INVALIDATED);
        assertThat(booking.getValidationCodeInvalidatedAt()).isNotNull();
    }
}
