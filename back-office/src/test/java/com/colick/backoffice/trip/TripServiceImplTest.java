package com.colick.backoffice.trip;

import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.ResourceNotFoundException;
import com.colick.backoffice.exception.TripBookingConflictException;
import com.colick.backoffice.location.entity.LocationType;
import com.colick.backoffice.location.repository.LocationRepository;
import com.colick.backoffice.trip.dto.*;
import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.entity.TripBooking;
import com.colick.backoffice.trip.repository.TripBookingRepository;
import com.colick.backoffice.trip.repository.TripRepository;
import com.colick.backoffice.trip.service.BookingValidationService;
import com.colick.backoffice.trip.service.TripServiceImpl;
import com.colick.backoffice.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceImplTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripBookingRepository bookingRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private BookingValidationService bookingValidationService;

    @InjectMocks
    private TripServiceImpl tripService;

    private User traveler;
    private User sender;
    private Trip sampleTrip;

    @BeforeEach
    void setUp() {
        traveler = User.builder()
                .id(1L)
                .firstName("Alice")
                .lastName("Dupont")
                .email("alice@example.com")
                .role(User.Role.USER)
                .build();

        sender = User.builder()
                .id(2L)
                .firstName("Bob")
                .lastName("Martin")
                .email("bob@example.com")
                .role(User.Role.USER)
                .build();

        sampleTrip = Trip.builder()
                .id(10L)
                .traveler(traveler)
                .departureAddress("Paris")
                .destination("Abidjan")
                .departureTime(LocalDateTime.now().plusDays(5))
                .arrivalTime(LocalDateTime.now().plusDays(6))
                .maxWeight(BigDecimal.valueOf(20))
                .pricePerKilo(BigDecimal.valueOf(5))
                .instantAcceptance(false)
                .status(Trip.TripStatus.ACTIVE)
                .build();

        lenient().when(bookingValidationService.normalizeRecipientContact(anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createTrip_shouldSaveAndReturnResponse() {
        CreateTripRequest request = new CreateTripRequest();
        request.setDepartureAddress("Paris");
        request.setDestination("Abidjan");
        request.setDepartureTime(LocalDateTime.now().plusDays(5));
        request.setArrivalTime(LocalDateTime.now().plusDays(6));
        request.setMaxWeight(BigDecimal.valueOf(20));
        request.setPricePerKilo(BigDecimal.valueOf(5));

        when(tripRepository.save(any(Trip.class))).thenReturn(sampleTrip);

        TripResponse response = tripService.createTrip(request, traveler);

        assertThat(response.getDepartureAddress()).isEqualTo("Paris");
        assertThat(response.getDestination()).isEqualTo("Abidjan");
        verify(tripRepository).save(any(Trip.class));
    }

    @Test
    void getAllTrips_shouldReturnActiveTrips() {
        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE)).thenReturn(List.of(sampleTrip));

        List<TripResponse> trips = tripService.getAllTrips();

        assertThat(trips).hasSize(1);
        assertThat(trips.get(0).getId()).isEqualTo(10L);
    }

    @Test
    void getTripById_shouldReturnTrip_whenFound() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));

        TripResponse response = tripService.getTripById(10L);

        assertThat(response.getId()).isEqualTo(10L);
    }

    @Test
    void getTripById_shouldThrow_whenNotFound() {
        when(tripRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tripService.getTripById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void deleteTrip_shouldCancelTrip_whenOwner() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(tripRepository.save(any(Trip.class))).thenReturn(sampleTrip);
        when(bookingRepository.findByTripAndStatusIn(eq(sampleTrip), anyList())).thenReturn(List.of());

        tripService.deleteTrip(10L, traveler);

        assertThat(sampleTrip.getStatus()).isEqualTo(Trip.TripStatus.CANCELLED);
        verify(tripRepository).save(sampleTrip);
    }

    @Test
    void deleteTrip_shouldNotifyAllActiveBookingSenders() {
        TripBooking pending = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .status(TripBooking.BookingStatus.PENDING).build();
        User anotherSender = User.builder().id(3L).firstName("Claire")
                .email("claire@example.com").role(User.Role.USER).build();
        TripBooking accepted = TripBooking.builder()
                .id(2L).trip(sampleTrip).sender(anotherSender)
                .status(TripBooking.BookingStatus.ACCEPTED).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(tripRepository.save(any(Trip.class))).thenReturn(sampleTrip);
        when(bookingRepository.findByTripAndStatusIn(eq(sampleTrip), anyList()))
                .thenReturn(List.of(pending, accepted));
        doNothing().when(emailService).sendTripCancelledEmail(anyString(), anyString(), anyString(), anyString());

        tripService.deleteTrip(10L, traveler);

        verify(emailService).sendTripCancelledEmail(
                eq(sender.getEmail()), eq(sender.getFirstName()),
                eq(sampleTrip.getDepartureAddress()), eq(sampleTrip.getDestination()));
        verify(emailService).sendTripCancelledEmail(
                eq(anotherSender.getEmail()), eq(anotherSender.getFirstName()),
                eq(sampleTrip.getDepartureAddress()), eq(sampleTrip.getDestination()));
        verify(bookingValidationService).invalidateValidationCode(pending);
        verify(bookingValidationService).invalidateValidationCode(accepted);
    }

    @Test
    void cancelBooking_shouldSetCancelledAndNotifyTraveler_whenStatusIsAccepted() {
        TripBooking booking = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .title("Box").recipientContact("+225 00").weight(BigDecimal.valueOf(2))
                .status(TripBooking.BookingStatus.ACCEPTED).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any())).thenReturn(booking);
        doNothing().when(emailService).sendBookingCancelledBySenderEmail(
                anyString(), anyString(), anyString(), anyString(), anyString());

        TripBookingResponse response = tripService.cancelBooking(10L, 1L, sender);

        assertThat(booking.getStatus()).isEqualTo(TripBooking.BookingStatus.CANCELLED);
        verify(bookingValidationService).invalidateValidationCode(booking);
        verify(emailService).sendBookingCancelledBySenderEmail(
                eq(traveler.getEmail()), eq(traveler.getFirstName()), eq(sender.getFirstName()),
                eq(sampleTrip.getDepartureAddress()), eq(sampleTrip.getDestination()));
    }

    @Test
    void cancelBooking_shouldSetCancelledAndNotifyTraveler_whenStatusIsPending() {
        TripBooking booking = TripBooking.builder()
                .id(2L).trip(sampleTrip).sender(sender)
                .title("Box").recipientContact("+225 00").weight(BigDecimal.valueOf(2))
                .status(TripBooking.BookingStatus.PENDING).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findById(2L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any())).thenReturn(booking);
        doNothing().when(emailService).sendBookingCancelledBySenderEmail(
                anyString(), anyString(), anyString(), anyString(), anyString());

        tripService.cancelBooking(10L, 2L, sender);

        assertThat(booking.getStatus()).isEqualTo(TripBooking.BookingStatus.CANCELLED);
        verify(bookingValidationService).invalidateValidationCode(booking);
    }

    @Test
    void cancelBooking_shouldThrow_whenRequesterIsNotSender() {
        TripBooking booking = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .status(TripBooking.BookingStatus.ACCEPTED).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> tripService.cancelBooking(10L, 1L, traveler))
                .isInstanceOf(AccessDeniedException.class);
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBooking_shouldThrow_whenBookingIsAlreadyCancelled() {
        TripBooking booking = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .status(TripBooking.BookingStatus.CANCELLED).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> tripService.cancelBooking(10L, 1L, sender))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PENDING or ACCEPTED");
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBooking_shouldThrow_whenBookingIsRejected() {
        TripBooking booking = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .status(TripBooking.BookingStatus.REJECTED).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> tripService.cancelBooking(10L, 1L, sender))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PENDING or ACCEPTED");
    }

    @Test
    void deleteTrip_shouldThrow_whenNotOwner() {
        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));

        assertThatThrownBy(() -> tripService.deleteTrip(10L, sender))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createBooking_shouldSaveWithPendingStatus_whenNotInstantAcceptance() {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTitle("Electronics");
        request.setWeight(BigDecimal.valueOf(5));
        request.setDescription("Fragile items");
        request.setRecipientContact("+225 07 00 00 00");

        TripBooking savedBooking = TripBooking.builder()
                .id(1L)
                .trip(sampleTrip)
                .sender(sender)
                .title("Electronics")
                .weight(BigDecimal.valueOf(5))
                .description("Fragile items")
                .recipientContact("+225 07 00 00 00")
                .status(TripBooking.BookingStatus.PENDING)
                .build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of());
        when(bookingRepository.save(any(TripBooking.class))).thenReturn(savedBooking);
        doNothing().when(emailService).sendTripBookingCreatedEmail(anyString(), anyString(), anyString(), anyString(), anyString());

        TripBookingResponse response = tripService.createBooking(10L, request, sender);

        assertThat(response.getStatus()).isEqualTo(TripBooking.BookingStatus.PENDING);
        assertThat(response.getTitle()).isEqualTo("Electronics");
        assertThat(response.getRecipientContact()).isEqualTo("+225 07 00 00 00");
        verify(bookingValidationService).normalizeRecipientContact("+225 07 00 00 00");
        verify(bookingValidationService, never()).sendValidationCode(any());
        verify(emailService).sendTripBookingCreatedEmail(
                eq(traveler.getEmail()),
                eq(traveler.getFirstName()),
                eq(sender.getFirstName()),
                eq(sampleTrip.getDepartureAddress()),
                eq(sampleTrip.getDestination())
        );
    }

    @Test
    void createBooking_shouldSaveWithAcceptedStatus_whenInstantAcceptance() {
        sampleTrip.setInstantAcceptance(true);

        CreateBookingRequest request = new CreateBookingRequest();
        request.setTitle("Clothes");
        request.setWeight(BigDecimal.valueOf(3));
        request.setRecipientContact("+225 01 00 00 00");

        TripBooking savedBooking = TripBooking.builder()
                .id(2L).trip(sampleTrip).sender(sender)
                .title("Clothes")
                .weight(BigDecimal.valueOf(3))
                .recipientContact("+225 01 00 00 00")
                .status(TripBooking.BookingStatus.ACCEPTED).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of());
        when(bookingRepository.save(any(TripBooking.class))).thenReturn(savedBooking);
        doNothing().when(emailService).sendTripBookingCreatedEmail(anyString(), anyString(), anyString(), anyString(), anyString());
        doNothing().when(bookingValidationService).sendValidationCode(any());

        TripBookingResponse response = tripService.createBooking(10L, request, sender);

        assertThat(response.getStatus()).isEqualTo(TripBooking.BookingStatus.ACCEPTED);
        verify(bookingValidationService).sendValidationCode(savedBooking);
    }

    @Test
    void createBooking_shouldThrow_whenSenderAlreadyHasActiveBookingForTrip() {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTitle("Electronics");
        request.setWeight(BigDecimal.valueOf(5));
        request.setRecipientContact("+225 07 00 00 00");

        List<TripBooking.BookingStatus> activeStatuses = List.of(
                TripBooking.BookingStatus.PENDING, TripBooking.BookingStatus.ACCEPTED);
        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.existsByTripAndSenderAndStatusIn(
                sampleTrip, sender, activeStatuses)).thenReturn(true);

        assertThatThrownBy(() -> tripService.createBooking(10L, request, sender))
                .isInstanceOf(TripBookingConflictException.class)
                .hasMessage("Vous avez deja une demande en cours pour ce trajet");

        verify(bookingRepository, never()).save(any(TripBooking.class));
        verify(emailService, never()).sendTripBookingCreatedEmail(anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void createBooking_shouldAllowNewRequest_whenPreviousBookingWasCancelledOrRejected() {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTitle("Electronics");
        request.setWeight(BigDecimal.valueOf(5));
        request.setRecipientContact("+225 07 00 00 00");

        TripBooking savedBooking = TripBooking.builder()
                .id(3L)
                .trip(sampleTrip)
                .sender(sender)
                .title("Electronics")
                .weight(BigDecimal.valueOf(5))
                .recipientContact("+225 07 00 00 00")
                .status(TripBooking.BookingStatus.PENDING)
                .build();

        List<TripBooking.BookingStatus> activeStatuses = List.of(
                TripBooking.BookingStatus.PENDING, TripBooking.BookingStatus.ACCEPTED);
        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.existsByTripAndSenderAndStatusIn(
                sampleTrip, sender, activeStatuses)).thenReturn(false);
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of());
        when(bookingRepository.save(any(TripBooking.class))).thenReturn(savedBooking);
        doNothing().when(emailService).sendTripBookingCreatedEmail(anyString(), anyString(), anyString(), anyString(), anyString());

        TripBookingResponse response = tripService.createBooking(10L, request, sender);

        assertThat(response.getId()).isEqualTo(3L);
        assertThat(response.getStatus()).isEqualTo(TripBooking.BookingStatus.PENDING);
        verify(bookingRepository).save(any(TripBooking.class));
    }

        @Test
        void createBooking_shouldThrow_whenSenderIsTripOwner() {
                CreateBookingRequest request = new CreateBookingRequest();
                request.setTitle("My own trip booking");
                request.setWeight(BigDecimal.valueOf(1));
                request.setRecipientContact("+225 07 00 00 00");

                when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));

                assertThatThrownBy(() -> tripService.createBooking(10L, request, traveler))
                                .isInstanceOf(IllegalArgumentException.class)
                                .hasMessage("You cannot create a booking request for your own trip");

                verify(bookingRepository, never()).save(any(TripBooking.class));
                verify(emailService, never()).sendTripBookingCreatedEmail(anyString(), anyString(), anyString(), anyString(), anyString());
        }

    @Test
    void acceptBooking_shouldSetAcceptedAndSendEmail() {
        TripBooking booking = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .status(TripBooking.BookingStatus.PENDING).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any())).thenReturn(booking);
        doNothing().when(emailService).sendTripBookingAcceptedEmail(anyString(), anyString(), anyString(), anyString());

        tripService.acceptBooking(10L, 1L, traveler);

        assertThat(booking.getStatus()).isEqualTo(TripBooking.BookingStatus.ACCEPTED);
        verify(bookingValidationService).sendValidationCode(booking);
        verify(emailService).sendTripBookingAcceptedEmail(
                eq(sender.getEmail()),
                eq(sender.getFirstName()),
                eq(sampleTrip.getDepartureAddress()),
                eq(sampleTrip.getDestination())
        );
    }

    @Test
    void rejectBooking_shouldSetRejectedAndSendEmail() {
        TripBooking booking = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .status(TripBooking.BookingStatus.PENDING).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any())).thenReturn(booking);
        doNothing().when(emailService).sendTripBookingRejectedEmail(anyString(), anyString(), anyString(), anyString());

        tripService.rejectBooking(10L, 1L, traveler);

        assertThat(booking.getStatus()).isEqualTo(TripBooking.BookingStatus.REJECTED);
        verify(bookingValidationService).invalidateValidationCode(booking);
        verify(emailService).sendTripBookingRejectedEmail(
                eq(sender.getEmail()),
                eq(sender.getFirstName()),
                eq(sampleTrip.getDepartureAddress()),
                eq(sampleTrip.getDestination())
        );
    }

    @Test
    void removeBooking_shouldDeleteAndSendEmail() {
        TripBooking booking = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .status(TripBooking.BookingStatus.PENDING).build();

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        doNothing().when(emailService).sendTripBookingRemovedEmail(anyString(), anyString(), anyString(), anyString());
        doNothing().when(bookingRepository).delete(booking);

        tripService.removeBooking(10L, 1L, traveler);

        verify(emailService).sendTripBookingRemovedEmail(
                eq(sender.getEmail()),
                eq(sender.getFirstName()),
                eq(sampleTrip.getDepartureAddress()),
                eq(sampleTrip.getDestination())
        );
        verify(bookingRepository).delete(booking);
    }

    @Test
    void createBooking_shouldThrow_whenWeightExceedsAvailable() {
        // maxWeight = 20, existing accepted booking weight = 15 → available = 5
        TripBooking existingAccepted = TripBooking.builder()
                .id(99L).trip(sampleTrip).sender(sender)
                .title("Books")
                .weight(BigDecimal.valueOf(15))
                .recipientContact("+225 00 00 00 00")
                .status(TripBooking.BookingStatus.ACCEPTED).build();

        CreateBookingRequest request = new CreateBookingRequest();
        request.setTitle("Heavy package");
        request.setWeight(BigDecimal.valueOf(10)); // exceeds available 5 kg
        request.setRecipientContact("+225 07 00 00 00");

        when(tripRepository.findById(10L)).thenReturn(Optional.of(sampleTrip));
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of(existingAccepted));

        assertThatThrownBy(() -> tripService.createBooking(10L, request, sender))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Requested weight exceeds available weight");
    }

    // ---- Trip search tests -------------------------------------------------

    @Test
    void searchTrips_shouldReturnMatchingTripsByDeparture() {
        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE)).thenReturn(List.of(sampleTrip));
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "Paris"))
                .thenReturn(List.of());
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of());

        List<TripResponse> results = tripService.searchTrips("Paris", null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getDepartureAddress()).isEqualTo("Paris");
    }

    @Test
    void searchTrips_shouldReturnMatchingTripsByDestination() {
        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE)).thenReturn(List.of(sampleTrip));
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "Abidjan"))
                .thenReturn(List.of());
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of());

        List<TripResponse> results = tripService.searchTrips(null, "Abidjan");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getDestination()).isEqualTo("Abidjan");
    }

    @Test
    void searchTrips_shouldReturnEmpty_whenNoMatch() {
        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE)).thenReturn(List.of(sampleTrip));
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "Berlin"))
                .thenReturn(List.of());

        List<TripResponse> results = tripService.searchTrips("Berlin", null);

        assertThat(results).isEmpty();
    }

    @Test
    void searchTrips_shouldExpandCountryToCities() {
        // "France" is a country → should expand to its cities, including "Paris"
        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE)).thenReturn(List.of(sampleTrip));
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "France"))
                .thenReturn(List.of("Paris", "Lyon", "Marseille"));
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of());

        List<TripResponse> results = tripService.searchTrips("France", null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getDepartureAddress()).isEqualTo("Paris");
    }

    @Test
    void searchTrips_shouldComputeAvailableWeight() {
        TripBooking accepted = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .weight(BigDecimal.valueOf(7))
                .status(TripBooking.BookingStatus.ACCEPTED).build();

        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE)).thenReturn(List.of(sampleTrip));
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "Paris"))
                .thenReturn(List.of());
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of(accepted));

        List<TripResponse> results = tripService.searchTrips("Paris", null);

        assertThat(results).hasSize(1);
        // maxWeight (20) - accepted weight (7) = 13
        assertThat(results.get(0).getAvailableWeight()).isEqualByComparingTo(BigDecimal.valueOf(13));
    }

    @Test
    void searchTrips_shouldReturnFullMaxWeight_whenNoAcceptedBookings() {
        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE)).thenReturn(List.of(sampleTrip));
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "Paris"))
                .thenReturn(List.of());
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of());

        List<TripResponse> results = tripService.searchTrips("Paris", null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getAvailableWeight()).isEqualByComparingTo(BigDecimal.valueOf(20));
    }

    @Test
    void searchTrips_shouldFilterByBothDepartureAndDestination() {
        Trip anotherTrip = Trip.builder()
                .id(11L).traveler(traveler)
                .departureAddress("Lyon").destination("Dakar")
                .departureTime(LocalDateTime.now().plusDays(3))
                .arrivalTime(LocalDateTime.now().plusDays(4))
                .maxWeight(BigDecimal.valueOf(15))
                .pricePerKilo(BigDecimal.valueOf(8))
                .status(Trip.TripStatus.ACTIVE).build();

        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE))
                .thenReturn(List.of(sampleTrip, anotherTrip));
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "Paris"))
                .thenReturn(List.of());
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "Abidjan"))
                .thenReturn(List.of());
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of());

        List<TripResponse> results = tripService.searchTrips("Paris", "Abidjan");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getDepartureAddress()).isEqualTo("Paris");
        assertThat(results.get(0).getDestination()).isEqualTo("Abidjan");
    }

    @Test
    void searchTrips_shouldIgnoreBookingsWithNullWeight() {
        TripBooking acceptedNoWeight = TripBooking.builder()
                .id(1L).trip(sampleTrip).sender(sender)
                .weight(null)
                .status(TripBooking.BookingStatus.ACCEPTED).build();

        when(tripRepository.findByStatus(Trip.TripStatus.ACTIVE)).thenReturn(List.of(sampleTrip));
        when(locationRepository.findNamesByTypeAndCountryContaining(LocationType.CITY, "Paris"))
                .thenReturn(List.of());
        when(bookingRepository.findByTripAndStatus(sampleTrip, TripBooking.BookingStatus.ACCEPTED))
                .thenReturn(List.of(acceptedNoWeight));

        List<TripResponse> results = tripService.searchTrips("Paris", null);

        assertThat(results).hasSize(1);
        // Null weights are ignored, so availableWeight = maxWeight = 20
        assertThat(results.get(0).getAvailableWeight()).isEqualByComparingTo(BigDecimal.valueOf(20));
    }
}
