package com.coliclic.backoffice.trip;

import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.support.TestLocalizedMessages;
import com.coliclic.backoffice.trip.controller.TripController;
import com.coliclic.backoffice.trip.dto.TripResponse;
import com.coliclic.backoffice.trip.service.TripService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TripControllerTest {

    @Mock
    private TripService tripService;

    @Spy
    private LocalizedMessages localizedMessages = TestLocalizedMessages.create();

    @InjectMocks
    private TripController tripController;

    @BeforeEach
    void setUp() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
    }

    @Test
    void getTripByReference_shouldExposeReferenceLookupEndpoint() {
        TripResponse trip = TripResponse.builder()
                .id(13L)
                .reference("TRP-2026-000013")
                .departureAddress("Paris")
                .destination("Abidjan")
                .build();
        when(tripService.getTripByReference("TRP-2026-000013")).thenReturn(trip);

        var response = tripController.getTripByReference("TRP-2026-000013");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(trip);
        verify(tripService).getTripByReference("TRP-2026-000013");
    }

    @ParameterizedTest
    @CsvSource({"Paris,", ",Abidjan", "Paris,Abidjan"})
    void searchTrips_shouldAcceptAtLeastOneCity(String departure, String destination) {
        LocalDate date = LocalDate.of(2027, 1, 1);
        when(tripService.searchTrips(departure, destination, date, null, null, null))
                .thenReturn(List.of());

        var response = tripController.searchTrips(departure, destination, date, null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(tripService).searchTrips(departure, destination, date, null, null, null);
    }

    @ParameterizedTest
    @CsvSource({",", "' ',' '", ",' '"})
    void searchTrips_shouldRejectMissingCitiesEvenWithDate(String departure, String destination) {
        assertThatThrownBy(() -> tripController.searchTrips(departure, destination,
                LocalDate.of(2027, 1, 1), null, null, null))
                .isInstanceOf(BadRequestException.class);
        verifyNoInteractions(tripService);
    }
}
