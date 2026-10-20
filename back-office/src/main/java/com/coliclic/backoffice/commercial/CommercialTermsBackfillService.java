package com.coliclic.backoffice.commercial;

import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Assigns the historical commission terms to bookings created before terms were persisted. */
@Service
@RequiredArgsConstructor
public class CommercialTermsBackfillService {

    private final TripBookingRepository bookingRepository;

    @Transactional
    public int backfillMissingTerms() {
        List<TripBooking> bookings = bookingRepository.findBookingsMissingCommercialTerms();
        bookings.forEach(booking -> {
            CommercialMode mode = booking.getCommercialMode();
            if (mode == null) {
                mode = booking.getPlatformFeeRate() != null && booking.getPlatformFeeRate().signum() == 0
                        ? CommercialMode.FREE
                        : CommercialMode.COMMISSION;
                booking.setCommercialMode(mode);
            }
            if (booking.getPlatformFeeRate() == null) {
                booking.setPlatformFeeRate(mode.getPlatformFeeRate());
            }
        });
        bookingRepository.saveAll(bookings);
        return bookings.size();
    }
}
