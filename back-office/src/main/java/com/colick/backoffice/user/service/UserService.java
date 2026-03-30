package com.colick.backoffice.user.service;

import com.colick.backoffice.user.dto.CreateUserRequest;
import com.colick.backoffice.user.dto.UpdateUserRequest;
import com.colick.backoffice.user.dto.UserResponse;

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
}
