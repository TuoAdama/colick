package com.colick.backoffice.auth.passwordreset.repository;

import com.colick.backoffice.auth.passwordreset.entity.PasswordResetToken;
import com.colick.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for password reset tokens.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    List<PasswordResetToken> findAllByUserAndUsedAtIsNull(User user);

    void deleteAllByExpiresAtBefore(LocalDateTime threshold);
}
