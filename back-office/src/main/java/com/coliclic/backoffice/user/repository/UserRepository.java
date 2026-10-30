package com.coliclic.backoffice.user.repository;

import com.coliclic.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * JPA repository for {@link User} entities.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("""
            select u from User u
            where :q = '' or locate(:q, lower(u.firstName)) > 0
                or locate(:q, lower(u.lastName)) > 0 or locate(:q, lower(u.email)) > 0
            order by case when u.createdAt is null then 1 else 0 end, u.createdAt desc, u.id desc
            """)
    Page<User> searchForAdmin(
            @Param("q") String query,
            Pageable pageable);

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleSubject(String googleSubject);

    boolean existsByEmail(String email);

    /** Looks up a user by the one-time e-mail confirmation token. */
    Optional<User> findByEmailConfirmToken(String token);

    /** Looks up a user by the signup confirmation token. */
    Optional<User> findBySignupConfirmToken(String token);
}
