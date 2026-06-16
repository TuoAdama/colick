package com.colick.backoffice.tripalert.service;

import com.colick.backoffice.trip.entity.Trip;
import com.colick.backoffice.tripalert.dto.CreateTripAlertRequest;
import com.colick.backoffice.tripalert.dto.TripAlertResponse;
import com.colick.backoffice.user.entity.User;

import java.util.List;

public interface TripAlertService {

    TripAlertResponse createAlert(CreateTripAlertRequest request, User user);

    List<TripAlertResponse> getMyAlerts(User user);

    void deleteAlert(Long alertId, User user);

    void notifyMatchingAlerts(Trip trip);
}
