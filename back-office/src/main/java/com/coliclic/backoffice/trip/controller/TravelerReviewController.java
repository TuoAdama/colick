package com.coliclic.backoffice.trip.controller;

import com.coliclic.backoffice.trip.dto.SubmitTravelerReviewRequest;
import com.coliclic.backoffice.trip.dto.TravelerReviewResponse;
import com.coliclic.backoffice.trip.service.TravelerReviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Public endpoints for token-based traveler review access and submission.
 */
@Validated
@RestController
@RequestMapping("/traveler-reviews")
public class TravelerReviewController {

    private final TravelerReviewService travelerReviewService;

    public TravelerReviewController(TravelerReviewService travelerReviewService) {
        this.travelerReviewService = travelerReviewService;
    }

    @GetMapping
    public ResponseEntity<TravelerReviewResponse> getReviewByToken(
            @RequestParam @NotBlank String token) {
        return ResponseEntity.ok(travelerReviewService.getReviewByToken(token));
    }

    @PostMapping
    public ResponseEntity<TravelerReviewResponse> submitReview(
            @RequestParam @NotBlank String token,
            @Valid @RequestBody SubmitTravelerReviewRequest request) {
        return ResponseEntity.ok(travelerReviewService.submitReview(token, request));
    }
}
