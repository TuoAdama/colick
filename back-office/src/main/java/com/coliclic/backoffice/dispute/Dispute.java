package com.coliclic.backoffice.dispute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.Instant;

@Entity
@Table(name = "disputes", indexes = @Index(name = "idx_disputes_received_at_id", columnList = "received_at, id"))
@Getter
public class Dispute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "received_at", nullable = false, updatable = false)
    private Instant receivedAt;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false, length = DisputeRequest.DESCRIPTION_MAX_LENGTH)
    private String description;

    @Column(length = DisputeRequest.REFERENCE_MAX_LENGTH)
    private String tripReference;

    @Column(length = DisputeRequest.REFERENCE_MAX_LENGTH)
    private String bookingReference;

    protected Dispute() {
    }

    public Dispute(Instant receivedAt, String email, String description, String tripReference, String bookingReference) {
        this.receivedAt = receivedAt;
        this.email = email;
        this.description = description;
        this.tripReference = tripReference;
        this.bookingReference = bookingReference;
    }
}
