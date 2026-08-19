package com.coliclic.backoffice.parcelrequest.controller;

import com.coliclic.backoffice.parcelrequest.dto.CreateParcelRequestRequest;
import com.coliclic.backoffice.parcelrequest.dto.ParcelRequestResponse;
import com.coliclic.backoffice.parcelrequest.service.ParcelRequestService;
import com.coliclic.backoffice.user.entity.User;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/parcel-requests")
@PreAuthorize("isAuthenticated()")
public class ParcelRequestController {

    private final ParcelRequestService parcelRequestService;

    public ParcelRequestController(ParcelRequestService parcelRequestService) {
        this.parcelRequestService = parcelRequestService;
    }

    @PostMapping
    public ResponseEntity<ParcelRequestResponse> createRequest(
            @Valid @RequestBody CreateParcelRequestRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parcelRequestService.createRequest(request, currentUser));
    }

    @GetMapping
    public ResponseEntity<List<ParcelRequestResponse>> getAvailableRequests(
            @RequestParam(required = false) String departure,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(parcelRequestService.getAvailableRequests(departure, destination, date, currentUser));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ParcelRequestResponse>> getMyRequests(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(parcelRequestService.getMyRequests(currentUser));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<ParcelRequestResponse> closeRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(parcelRequestService.closeRequest(id, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        parcelRequestService.cancelRequest(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<ParcelRequestResponse> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(parcelRequestService.uploadPhoto(id, file, currentUser));
    }
}
