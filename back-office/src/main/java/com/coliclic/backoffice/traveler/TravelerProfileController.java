package com.coliclic.backoffice.traveler;

import com.coliclic.backoffice.traveler.dto.TravelerProfileResponse;
import com.coliclic.backoffice.traveler.dto.TravelerReviewsPageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/travelers")
public class TravelerProfileController {
    private final TravelerProfileService service;

    public TravelerProfileController(TravelerProfileService service) {
        this.service = service;
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<TravelerProfileResponse> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(service.getProfile(id));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<TravelerReviewsPageResponse> getReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(service.getReviews(id, page, size));
    }
}
