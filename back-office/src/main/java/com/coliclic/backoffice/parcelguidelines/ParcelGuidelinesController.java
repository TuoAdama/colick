package com.coliclic.backoffice.parcelguidelines;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/parcel-guidelines")
public class ParcelGuidelinesController {
    @GetMapping
    public ResponseEntity<ParcelGuidelinesResponse> getCurrentGuidelines() {
        return ResponseEntity.ok(ParcelGuidelinesResponse.current());
    }
}
