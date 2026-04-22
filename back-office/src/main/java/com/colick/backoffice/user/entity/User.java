package com.colick.backoffice.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Represents an application user (traveler or sender).
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String phone;

    @Column(nullable = false)
    private String identityDocument;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    /** URL path to the user's profile photo (nullable). */
    @Column
    private String photoUrl;

    /** Pending new e-mail address waiting for token confirmation (nullable). */
    @Column
    private String pendingEmail;

    /** One-time token used to confirm an e-mail change request (nullable). */
    @Column
    private String emailConfirmToken;

    /** Expiry timestamp of the e-mail confirmation token (nullable). */
    @Column
    private LocalDateTime emailConfirmTokenExpiresAt;

    public enum Role {
        USER, ADMIN
    }
}
