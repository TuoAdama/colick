package com.colick.backoffice.user.service;

import com.colick.backoffice.email.EmailService;
import com.colick.backoffice.exception.ResourceNotFoundException;
import com.colick.backoffice.exception.UserAlreadyExistsException;
import com.colick.backoffice.file.FileStorageService;
import com.colick.backoffice.user.dto.CreateUserRequest;
import com.colick.backoffice.user.dto.UpdateUserRequest;
import com.colick.backoffice.user.dto.UserResponse;
import com.colick.backoffice.user.entity.User;
import com.colick.backoffice.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of {@link UserService}.
 */
@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;
    @Value("${app.frontend.base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           FileStorageService fileStorageService,
                           EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
        this.emailService = emailService;
    }

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("A user with email " + request.getEmail() + " already exists");
        }
        String signupToken = UUID.randomUUID().toString();
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .identityDocument(request.getIdentityDocument())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(false)
                .signupConfirmToken(signupToken)
                .signupConfirmTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .role(User.Role.USER)
                .build();
        User createdUser = userRepository.save(user);
        emailService.sendSignupActivationEmail(
                createdUser.getEmail(),
                createdUser.getFirstName(),
                buildConfirmEmailUrl(signupToken)
        );
        return UserResponse.from(createdUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return UserResponse.from(findOrThrow(id));
    }

    @Override
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = findOrThrow(id);
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(user.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
                throw new UserAlreadyExistsException("A user with email " + request.getEmail() + " already exists");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getIdentityDocument() != null) user.setIdentityDocument(request.getIdentityDocument());
        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setLocalAuthEnabled(true);
        }
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public void deleteUser(Long id) {
        User user = findOrThrow(id);
        userRepository.delete(user);
    }

    // -------------------------------------------------------------------------
    // Profile-enhancement operations
    // -------------------------------------------------------------------------

    /**
     * Stores the provided file and updates the user's {@code photoUrl}.
     */
    @Override
    public UserResponse uploadPhoto(Long id, MultipartFile file) {
        User user = findOrThrow(id);
        String url = fileStorageService.store(file);
        user.setPhotoUrl(url);
        return UserResponse.from(userRepository.save(user));
    }

    /**
     * Saves a pending e-mail address alongside a 24-hour confirmation token,
     * then sends the confirmation link to the new address.
     */
    @Override
    public void requestEmailChange(Long id, String newEmail) {
        User user = findOrThrow(id);
        if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
            throw new UserAlreadyExistsException("A user with email " + newEmail + " already exists");
        }
        String token = UUID.randomUUID().toString();
        user.setPendingEmail(newEmail);
        user.setEmailConfirmToken(token);
        user.setEmailConfirmTokenExpiresAt(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        String confirmUrl = buildConfirmEmailUrl(token);
        emailService.sendEmailChangeConfirmationEmail(
                newEmail,
                user.getFirstName(),
                confirmUrl
        );
    }

    private String buildConfirmEmailUrl(String token) {
        String baseUrl = (frontendBaseUrl == null || frontendBaseUrl.isBlank())
                ? "http://localhost:4200"
                : frontendBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + "/confirm-email?token=" + token;
    }

    /**
     * Validates the confirmation token and, if valid, promotes the pending
     * e-mail address to the user's active e-mail.
     */
    @Override
    public UserResponse confirmEmailChange(String token) {
        User signupUser = userRepository.findBySignupConfirmToken(token).orElse(null);
        if (signupUser != null) {
            if (isExpired(signupUser.getSignupConfirmTokenExpiresAt())) {
                throw new ResourceNotFoundException("Token has expired");
            }
            signupUser.setEnabled(true);
            signupUser.setSignupConfirmToken(null);
            signupUser.setSignupConfirmTokenExpiresAt(null);
            return UserResponse.from(userRepository.save(signupUser));
        }

        User user = userRepository.findByEmailConfirmToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired token"));
        if (isExpired(user.getEmailConfirmTokenExpiresAt())) {
            throw new ResourceNotFoundException("Token has expired");
        }
        if (user.getPendingEmail() == null || user.getPendingEmail().isBlank()) {
            throw new ResourceNotFoundException("Invalid or expired token");
        }
        user.setEmail(user.getPendingEmail());
        user.setPendingEmail(null);
        user.setEmailConfirmToken(null);
        user.setEmailConfirmTokenExpiresAt(null);
        return UserResponse.from(userRepository.save(user));
    }

    /**
     * Verifies the old password and, if correct, replaces it with the new one.
     */
    @Override
    public UserResponse changePassword(Long id, String oldPassword, String newPassword) {
        User user = findOrThrow(id);
        if (Boolean.FALSE.equals(user.getLocalAuthEnabled())) {
            throw new AccessDeniedException(
                    "Ce compte n'a pas encore de mot de passe local. Utilisez Google ou le parcours mot de passe oublie."
            );
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new AccessDeniedException("Old password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setLocalAuthEnabled(true);
        return UserResponse.from(userRepository.save(user));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private boolean isExpired(LocalDateTime expiresAt) {
        return expiresAt == null || expiresAt.isBefore(LocalDateTime.now());
    }

}
