package com.coliclic.backoffice.trip;

import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.trip.service.TripReferenceBackfillService;
import com.coliclic.backoffice.trip.service.TripReferenceGenerator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TripReferenceBackfillServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Test
    void backfillMissingReferences_shouldGenerateReferencesForExistingTrips() {
        Trip missingReferenceTrip = Trip.builder()
                .id(13L)
                .createdAt(LocalDateTime.of(2026, 6, 27, 10, 0))
                .build();
        when(tripRepository.findTripsMissingReference()).thenReturn(List.of(missingReferenceTrip));
        TripReferenceBackfillService service = new TripReferenceBackfillService(
                tripRepository,
                new TripReferenceGenerator(mock(JdbcTemplate.class))
        );

        int count = service.backfillMissingReferences();

        assertThat(count).isEqualTo(1);
        assertThat(missingReferenceTrip.getReference()).isEqualTo("TRP-2026-000013");
        verify(tripRepository).saveAll(List.of(missingReferenceTrip));
    }
}
