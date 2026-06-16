package com.colick.backoffice.tripalert.repository;

import com.colick.backoffice.tripalert.entity.TripAlert;
import com.colick.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripAlertRepository extends JpaRepository<TripAlert, Long> {

    List<TripAlert> findByUserOrderByCreatedAtDesc(User user);

    List<TripAlert> findByUser(User user);
}
