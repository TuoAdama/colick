package com.colick.backoffice.user.repository;

import com.colick.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * JPA repository for {@link User} entities.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleSubject(String googleSubject);

    boolean existsByEmail(String email);

    /** Looks up a user by the one-time e-mail confirmation token. */
    Optional<User> findByEmailConfirmToken(String token);

    /** Looks up a user by the signup confirmation token. */
    Optional<User> findBySignupConfirmToken(String token);
}
