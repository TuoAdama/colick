package com.colick.backoffice.user.service;

import com.colick.backoffice.user.dto.CreateUserRequest;
import com.colick.backoffice.user.dto.UpdateUserRequest;
import com.colick.backoffice.user.dto.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service interface for user management operations.
 */
public interface UserService {

    /** Creates a new user account. */
    UserResponse createUser(CreateUserRequest request);

    /** Returns all registered users (admin-only). */
    List<UserResponse> getAllUsers();

    /** Returns a single user by ID. */
    UserResponse getUserById(Long id);

    /** Updates an existing user's information. */
    UserResponse updateUser(Long id, UpdateUserRequest request);

    /** Deletes a user by ID (admin-only). */
    void deleteUser(Long id);

    /** Uploads or replaces the profile photo for the given user. */
    UserResponse uploadPhoto(Long id, MultipartFile file);

    /**
     * Initiates an e-mail change by persisting a pending address and sending a
     * confirmation link to {@code newEmail}.
     */
    void requestEmailChange(Long id, String newEmail);

    /**
     * Confirms an e-mail change by validating the one-time token and applying
     * the pending address as the user's active e-mail.
     */
    UserResponse confirmEmailChange(String token);

    /**
     * Changes the user's password after verifying that {@code oldPassword}
     * matches the currently stored hash.
     */
    UserResponse changePassword(Long id, String oldPassword, String newPassword);
}
