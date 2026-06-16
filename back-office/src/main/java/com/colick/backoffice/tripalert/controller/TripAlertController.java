package com.colick.backoffice.tripalert.controller;

import com.colick.backoffice.tripalert.dto.CreateTripAlertRequest;
import com.colick.backoffice.tripalert.dto.TripAlertResponse;
import com.colick.backoffice.tripalert.service.TripAlertService;
import com.colick.backoffice.user.entity.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trip-alerts")
public class TripAlertController {

    private final TripAlertService tripAlertService;

    public TripAlertController(TripAlertService tripAlertService) {
        this.tripAlertService = tripAlertService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TripAlertResponse> createAlert(
            @Valid @RequestBody CreateTripAlertRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tripAlertService.createAlert(request, currentUser));
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TripAlertResponse>> getMyAlerts(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(tripAlertService.getMyAlerts(currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteAlert(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        tripAlertService.deleteAlert(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
