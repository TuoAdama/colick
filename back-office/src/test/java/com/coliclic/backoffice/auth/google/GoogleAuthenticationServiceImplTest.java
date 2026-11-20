package com.coliclic.backoffice.auth.google;

import com.coliclic.backoffice.auth.dto.AuthenticationResult;
import com.coliclic.backoffice.auth.util.JwtUtil;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.support.TestLocalizedMessages;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleAuthenticationServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private GoogleTokenVerifier googleTokenVerifier;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Spy
    private LocalizedMessages localizedMessages = TestLocalizedMessages.create();

    @InjectMocks
    private GoogleAuthenticationServiceImpl googleAuthenticationService;

    @BeforeEach
    void setUp() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
    }

    @Test
    void authenticate_shouldCreateGoogleUser_whenEmailIsUnknown() {
        GoogleTokenPayload payload = new GoogleTokenPayload(
                "google-subject",
                "ada@example.com",
                "Ada",
                "Lovelace",
                "Ada Lovelace",
                true
        );
        when(googleTokenVerifier.verify("google-id-token")).thenReturn(payload);
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("ada@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any(String.class))).thenReturn("encoded-random-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        when(jwtUtil.generateToken(any(User.class))).thenReturn("jwt-token");

        AuthenticationResult response = googleAuthenticationService.authenticate("google-id-token");

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().getEmail()).isEqualTo("ada@example.com");
        assertThat(response.user().getHasPassword()).isFalse();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getAuthProvider()).isEqualTo(User.AuthProvider.GOOGLE);
        assertThat(userCaptor.getValue().getGoogleSubject()).isEqualTo("google-subject");
        assertThat(userCaptor.getValue().getEnabled()).isTrue();
        assertThat(userCaptor.getValue().getLocalAuthEnabled()).isFalse();
    }

    @Test
    void authenticate_shouldLinkExistingUserByEmailAndActivateIt() {
        GoogleTokenPayload payload = new GoogleTokenPayload(
                "google-subject",
                "ada@example.com",
                "Ada",
                "Lovelace",
                "Ada Lovelace",
                true
        );
        User existingUser = User.builder()
                .id(42L)
                .firstName("Ada")
                .lastName("Lovelace")
                .email("ada@example.com")
                .password("hashed-password")
                .enabled(false)
                .signupConfirmToken("signup-token")
                .signupConfirmTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .role(User.Role.USER)
                .build();

        when(googleTokenVerifier.verify("google-id-token")).thenReturn(payload);
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("ada@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);
        when(jwtUtil.generateToken(existingUser)).thenReturn("jwt-token");

        AuthenticationResult response = googleAuthenticationService.authenticate("google-id-token");

        assertThat(response.user().getHasPassword()).isTrue();
        assertThat(existingUser.getGoogleSubject()).isEqualTo("google-subject");
        assertThat(existingUser.getEnabled()).isTrue();
        assertThat(existingUser.getSignupConfirmToken()).isNull();
        assertThat(existingUser.getSignupConfirmTokenExpiresAt()).isNull();
        assertThat(existingUser.getAuthProvider()).isEqualTo(User.AuthProvider.LOCAL);
    }

    @Test
    void authenticate_shouldReject_whenExistingEmailIsAlreadyLinkedToAnotherGoogleAccount() {
        GoogleTokenPayload payload = new GoogleTokenPayload(
                "new-google-subject",
                "ada@example.com",
                "Ada",
                "Lovelace",
                "Ada Lovelace",
                true
        );
        User existingUser = User.builder()
                .id(42L)
                .firstName("Ada")
                .lastName("Lovelace")
                .email("ada@example.com")
                .password("hashed-password")
                .googleSubject("other-google-subject")
                .role(User.Role.USER)
                .build();

        when(googleTokenVerifier.verify("google-id-token")).thenReturn(payload);
        when(userRepository.findByGoogleSubject("new-google-subject")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("ada@example.com")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> googleAuthenticationService.authenticate("google-id-token"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("already linked");
    }

    @Test
    void getConfiguration_shouldExposeConfiguredClientId() {
        when(googleTokenVerifier.isConfigured()).thenReturn(true);
        when(googleTokenVerifier.getClientId()).thenReturn("google-client-id");

        var response = googleAuthenticationService.getConfiguration();

        assertThat(response.isEnabled()).isTrue();
        assertThat(response.getClientId()).isEqualTo("google-client-id");
        verify(googleTokenVerifier).isConfigured();
        verify(googleTokenVerifier).getClientId();
    }
}
