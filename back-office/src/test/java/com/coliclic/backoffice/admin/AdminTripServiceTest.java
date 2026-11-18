package com.coliclic.backoffice.admin;

import com.coliclic.backoffice.admin.service.AdminTripService;
import com.coliclic.backoffice.file.FileStorageService;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminTripServiceTest {
    @Mock TripRepository trips;
    @Mock TripBookingRepository bookings;
    @Mock FileStorageService storage;
    @InjectMocks AdminTripService service;

    @Test
    void activeTripWithNoReservedWeightKeepsFullCapacity() {
        when(trips.findById(1L)).thenReturn(Optional.of(trip(Trip.TripStatus.ACTIVE)));
        when(bookings.sumWeightByTripAndStatus(1L, TripBooking.BookingStatus.ACCEPTED)).thenReturn(Optional.empty());

        assertThat(service.detail(1L).availableWeight()).isEqualByComparingTo(BigDecimal.TEN);
    }

    @Test
    void historicalTripDoesNotOfferCapacityOrQueryReservedWeight() {
        when(trips.findById(1L)).thenReturn(Optional.of(trip(Trip.TripStatus.COMPLETED)));

        assertThat(service.detail(1L).availableWeight()).isNull();
        verifyNoInteractions(bookings);
    }

    private Trip trip(Trip.TripStatus status) {
        User traveler = User.builder().id(2L).firstName("Ada").lastName("Martin").build();
        return Trip.builder().id(1L).traveler(traveler).maxWeight(BigDecimal.TEN).status(status).build();
    }
}
