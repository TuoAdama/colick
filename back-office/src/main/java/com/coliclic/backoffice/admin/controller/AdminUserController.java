package com.coliclic.backoffice.admin.controller;

import com.coliclic.backoffice.admin.dto.*;
import com.coliclic.backoffice.admin.service.AdminUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final AdminUserService service;

    public AdminUserController(AdminUserService service) { this.service = service; }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    @ResponseStatus(org.springframework.http.HttpStatus.BAD_REQUEST)
    public com.coliclic.backoffice.exception.ApiError invalidParameter() {
        return new com.coliclic.backoffice.exception.ApiError(400, "Paramètre d’administration invalide.");
    }

    @GetMapping
    public AdminPage<AdminUserResponse> users(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "") String q) {
        return service.users(page, size, q);
    }

    @GetMapping("/{id}")
    public AdminUserDetailResponse detail(@PathVariable Long id) { return service.detail(id); }

    @GetMapping("/{id}/trips")
    public AdminPage<AdminTripResponse> trips(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.trips(id, page, size);
    }

    @GetMapping("/{id}/bookings")
    public AdminPage<AdminBookingResponse> bookings(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.bookings(id, page, size);
    }
}
