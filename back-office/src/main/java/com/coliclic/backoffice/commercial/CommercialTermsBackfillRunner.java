package com.coliclic.backoffice.commercial;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommercialTermsBackfillRunner implements ApplicationRunner {

    private final CommercialTermsBackfillService backfillService;

    @Override
    public void run(ApplicationArguments args) {
        backfillService.backfillMissingTerms();
    }
}
