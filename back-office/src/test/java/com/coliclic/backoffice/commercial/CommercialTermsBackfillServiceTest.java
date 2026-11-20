package com.coliclic.backoffice.commercial;

import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommercialTermsBackfillServiceTest {

    @Mock
    private TripBookingRepository bookingRepository;

    @Test
    void assignsHistoricalCommissionTermsToExistingBookings() {
        TripBooking legacyBooking = TripBooking.builder().id(42L).build();
        when(bookingRepository.findBookingsMissingCommercialTerms()).thenReturn(List.of(legacyBooking));
        CommercialTermsBackfillService service = new CommercialTermsBackfillService(bookingRepository);

        int count = service.backfillMissingTerms();

        assertThat(count).isEqualTo(1);
        assertThat(legacyBooking.getCommercialMode()).isEqualTo(CommercialMode.COMMISSION);
        assertThat(legacyBooking.getPlatformFeeRate()).isEqualByComparingTo("0.07");
        verify(bookingRepository).saveAll(List.of(legacyBooking));
    }
}
