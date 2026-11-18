package com.coliclic.backoffice.admin.controller;

import com.coliclic.backoffice.admin.dto.AdminPage;
import com.coliclic.backoffice.admin.dto.AdminPublishedTripResponse;
import com.coliclic.backoffice.admin.dto.AdminTripBookingDetailResponse;
import com.coliclic.backoffice.admin.dto.AdminTripBookingResponse;
import com.coliclic.backoffice.admin.dto.AdminTripDetailResponse;
import com.coliclic.backoffice.admin.service.AdminTripService;
import com.coliclic.backoffice.exception.ApiError;
import com.coliclic.backoffice.trip.service.TripService;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/trips")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTripController {
    private static final CacheControl PRIVATE_NO_STORE = CacheControl.noStore().cachePrivate();

    private final AdminTripService service;
    private final TripService tripService;

    public AdminTripController(AdminTripService service, TripService tripService) {
        this.service = service;
        this.tripService = tripService;
    }

    @GetMapping
    public AdminPage<AdminPublishedTripResponse> trips(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size,
                                                      @RequestParam(required = false) String sort,
                                                      @RequestParam(required = false)
                                                      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
                                                      @RequestParam(defaultValue = "") String q) {
        return service.trips(page, size, sort, createdFrom, q);
    }

    @GetMapping("/{id}")
    public AdminTripDetailResponse detail(@PathVariable Long id) {
        return service.detail(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        tripService.deleteTrip(id, currentUser);
    }

    @GetMapping("/{id}/bookings")
    public AdminPage<AdminTripBookingResponse> bookings(@PathVariable Long id,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size) {
        return service.bookings(id, page, size);
    }

    @GetMapping("/{id}/bookings/{bookingId}")
    public ResponseEntity<AdminTripBookingDetailResponse> booking(@PathVariable Long id, @PathVariable Long bookingId) {
        return ResponseEntity.ok().cacheControl(PRIVATE_NO_STORE).body(service.booking(id, bookingId));
    }

    @GetMapping("/{id}/bookings/{bookingId}/photo")
    public ResponseEntity<Resource> photo(@PathVariable Long id, @PathVariable Long bookingId) {
        Resource photo = new FileSystemResource(service.photo(id, bookingId));
        return ResponseEntity.ok()
                .contentType(MediaTypeFactory.getMediaType(photo).orElse(MediaType.APPLICATION_OCTET_STREAM))
                .cacheControl(PRIVATE_NO_STORE)
                .header("Content-Security-Policy", "default-src 'none'; sandbox")
                .header("X-Content-Type-Options", "nosniff")
                .body(photo);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError invalidParameter() {
        return new ApiError(400, "Paramètre d’administration invalide.");
    }
}
