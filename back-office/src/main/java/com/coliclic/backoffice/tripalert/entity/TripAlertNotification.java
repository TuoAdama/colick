package com.coliclic.backoffice.tripalert.entity;

import com.coliclic.backoffice.trip.entity.Trip;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "trip_alert_notifications",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_trip_alert_notification_alert_trip",
                columnNames = {"alert_id", "trip_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripAlertNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "alert_id", nullable = false)
    private TripAlert alert;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(nullable = false)
    private LocalDateTime sentAt;

    @PrePersist
    void setSentAtIfMissing() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }
}
