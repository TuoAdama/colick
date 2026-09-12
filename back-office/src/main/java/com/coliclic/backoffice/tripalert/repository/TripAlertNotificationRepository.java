package com.coliclic.backoffice.tripalert.repository;

import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.tripalert.entity.TripAlert;
import com.coliclic.backoffice.tripalert.entity.TripAlertNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripAlertNotificationRepository extends JpaRepository<TripAlertNotification, Long> {

    boolean existsByAlertAndTrip(TripAlert alert, Trip trip);

    void deleteByAlert(TripAlert alert);
}
