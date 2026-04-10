package com.colick.backoffice.user.controller;

import com.colick.backoffice.user.dto.ChangeEmailRequest;
import com.colick.backoffice.user.dto.ChangePasswordRequest;
import com.colick.backoffice.user.dto.CreateUserRequest;
import com.colick.backoffice.user.dto.UpdateUserRequest;
import com.colick.backoffice.user.dto.UserResponse;
import com.colick.backoffice.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST controller for user management endpoints.
 */
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** Register a new user account. */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    /** List all users (admin only). */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /** Get a user by ID. */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /** Update a user's information. */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    /** Delete a user by ID (admin only). */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /** Upload or replace the profile photo. */
    @PostMapping("/{id}/photo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadPhoto(id, file));
    }

    /** Initiate an e-mail change (sends a confirmation link to the new address). */
    @PostMapping("/{id}/change-email")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> requestEmailChange(
            @PathVariable Long id,
            @Valid @RequestBody ChangeEmailRequest request) {
        userService.requestEmailChange(id, request.getNewEmail());
        return ResponseEntity.accepted().build();
    }

    /** Confirm an e-mail change via token (public endpoint, called from the front-end link). */
    @GetMapping("/confirm-email")
    public ResponseEntity<UserResponse> confirmEmailChange(@RequestParam String token) {
        return ResponseEntity.ok(userService.confirmEmailChange(token));
    }

    /** Change the authenticated user's password (requires the current password). */
    @PutMapping("/{id}/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(userService.changePassword(id, request.getOldPassword(), request.getNewPassword()));
    }
}
