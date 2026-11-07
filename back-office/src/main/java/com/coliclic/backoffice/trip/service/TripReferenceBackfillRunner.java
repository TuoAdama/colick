package com.coliclic.backoffice.trip.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TripReferenceBackfillRunner implements ApplicationRunner {

    private final TripReferenceBackfillService tripReferenceBackfillService;

    @Override
    public void run(ApplicationArguments args) {
        tripReferenceBackfillService.backfillMissingReferences();
    }
}
