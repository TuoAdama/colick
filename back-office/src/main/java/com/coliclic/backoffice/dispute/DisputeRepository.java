package com.coliclic.backoffice.dispute;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    Page<Summary> findAllBy(Pageable pageable);

    record Summary(Long id, Instant receivedAt, String email, String tripReference, String bookingReference) {
    }
}
