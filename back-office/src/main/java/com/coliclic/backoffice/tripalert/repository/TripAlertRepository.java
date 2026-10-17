package com.coliclic.backoffice.tripalert.repository;

import com.coliclic.backoffice.tripalert.entity.TripAlert;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripAlertRepository extends JpaRepository<TripAlert, Long> {

    List<TripAlert> findByUserOrderByCreatedAtDesc(User user);

    List<TripAlert> findByUser(User user);
}
