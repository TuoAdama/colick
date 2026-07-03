package com.colick.backoffice.trip.service;

import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.trip.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TripReferenceBackfillService {

    private final TripRepository tripRepository;
    private final TripReferenceGenerator tripReferenceGenerator;

    @Transactional
    public int backfillMissingReferences() {
        List<Trip> trips = tripRepository.findTripsMissingReference();
        trips.forEach(trip -> trip.setReference(tripReferenceGenerator.generate(trip)));
        tripRepository.saveAll(trips);
        return trips.size();
    }
}
