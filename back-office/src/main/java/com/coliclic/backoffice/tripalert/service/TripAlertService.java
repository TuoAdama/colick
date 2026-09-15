package com.coliclic.backoffice.tripalert.service;

import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.tripalert.dto.CreateTripAlertRequest;
import com.coliclic.backoffice.tripalert.dto.TripAlertResponse;
import com.coliclic.backoffice.user.entity.User;

import java.util.List;

public interface TripAlertService {

    TripAlertResponse createAlert(CreateTripAlertRequest request, User user);

    List<TripAlertResponse> getMyAlerts(User user);

    void deleteAlert(Long alertId, User user);

    void notifyMatchingAlerts(Trip trip);
}
