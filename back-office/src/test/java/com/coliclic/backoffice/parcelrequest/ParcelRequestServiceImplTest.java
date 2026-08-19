package com.coliclic.backoffice.parcelrequest;

import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.file.FileStorageService;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.parcelrequest.dto.CreateParcelRequestRequest;
import com.coliclic.backoffice.parcelrequest.dto.ParcelRequestResponse;
import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.parcelrequest.repository.ParcelRequestRepository;
import com.coliclic.backoffice.parcelrequest.service.ParcelRequestServiceImpl;
import com.coliclic.backoffice.support.TestLocalizedMessages;
import com.coliclic.backoffice.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParcelRequestServiceImplTest {

    @Mock
    private ParcelRequestRepository parcelRequestRepository;

    @Mock
    private FileStorageService fileStorageService;

    private final LocalizedMessages localizedMessages = TestLocalizedMessages.create();

    private ParcelRequestServiceImpl service;
    private User sender;
    private User traveler;

    @BeforeEach
    void setUp() {
        service = new ParcelRequestServiceImpl(parcelRequestRepository, fileStorageService, localizedMessages);
        sender = user(1L, "Alice", "Sender");
        traveler = user(2L, "Bob", "Traveler");
    }

    @Test
    void createRequest_shouldSaveNormalizedRequest() {
        CreateParcelRequestRequest request = request("  Paris  ", " Abidjan ");
        when(fileStorageService.sanitizePublicUrl("/uploads/box.png")).thenReturn("/uploads/box.png");
        when(parcelRequestRepository.save(any(ParcelRequest.class))).thenAnswer(invocation -> {
            ParcelRequest saved = invocation.getArgument(0);
            saved.setId(10L);
            saved.setCreatedAt(LocalDateTime.now());
            saved.setUpdatedAt(LocalDateTime.now());
            return saved;
        });

        ParcelRequestResponse response = service.createRequest(request, sender);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getDeparture()).isEqualTo("Paris");
        assertThat(response.getDestination()).isEqualTo("Abidjan");
        assertThat(response.getSenderId()).isEqualTo(1L);
        verify(parcelRequestRepository).save(argThat(saved ->
                saved.getNormalizedDeparture().equals("paris")
                        && saved.getNormalizedDestination().equals("abidjan")
                        && saved.getPackageTitle().equals("Documents administratifs")
                        && saved.getDescription().equals("Petit colis fragile")
        ));
    }

    @Test
    void getAvailableRequests_shouldFilterActiveRequestsAndExcludeCurrentUser() {
        ParcelRequest matching = parcelRequest(10L, sender, "Paris", "Abidjan", LocalDate.of(2026, 7, 1));
        ParcelRequest own = parcelRequest(11L, traveler, "Paris", "Abidjan", LocalDate.of(2026, 7, 1));
        ParcelRequest wrongDestination = parcelRequest(12L, sender, "Paris", "Dakar", LocalDate.of(2026, 7, 1));
        ParcelRequest wrongDate = parcelRequest(13L, sender, "Paris", "Abidjan", LocalDate.of(2026, 7, 2));
        when(parcelRequestRepository.findByStatusOrderByCreatedAtDesc(ParcelRequest.ParcelRequestStatus.ACTIVE))
                .thenReturn(List.of(matching, own, wrongDestination, wrongDate));

        List<ParcelRequestResponse> responses = service.getAvailableRequests(
                "par", "abidjan", LocalDate.of(2026, 7, 1), traveler);

        assertThat(responses).extracting(ParcelRequestResponse::getId).containsExactly(10L);
    }

    @Test
    void closeRequest_shouldOnlyAllowOwner() {
        ParcelRequest request = parcelRequest(10L, sender, "Paris", "Abidjan", null);
        when(parcelRequestRepository.findById(10L)).thenReturn(Optional.of(request));
        when(parcelRequestRepository.save(request)).thenReturn(request);

        ParcelRequestResponse response = service.closeRequest(10L, sender);

        assertThat(response.getStatus()).isEqualTo(ParcelRequest.ParcelRequestStatus.CLOSED);
    }

    @Test
    void closeRequest_shouldRejectOtherUser() {
        ParcelRequest request = parcelRequest(10L, sender, "Paris", "Abidjan", null);
        when(parcelRequestRepository.findById(10L)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.closeRequest(10L, traveler))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void cancelRequest_shouldMarkAsCancelled() {
        ParcelRequest request = parcelRequest(10L, sender, "Paris", "Abidjan", null);
        when(parcelRequestRepository.findById(10L)).thenReturn(Optional.of(request));

        service.cancelRequest(10L, sender);

        assertThat(request.getStatus()).isEqualTo(ParcelRequest.ParcelRequestStatus.CANCELLED);
        verify(parcelRequestRepository).save(request);
    }

    @Test
    void uploadPhoto_shouldStoreAndAttachPhoto() {
        ParcelRequest request = parcelRequest(10L, sender, "Paris", "Abidjan", null);
        MockMultipartFile file = new MockMultipartFile("file", "box.png", "image/png", new byte[] {1});
        when(parcelRequestRepository.findById(10L)).thenReturn(Optional.of(request));
        when(fileStorageService.store(file)).thenReturn("/uploads/new.png");
        when(parcelRequestRepository.save(request)).thenReturn(request);

        ParcelRequestResponse response = service.uploadPhoto(10L, file, sender);

        assertThat(response.getPackagePhotoUrl()).isEqualTo("/uploads/new.png");
    }

    @Test
    void cancelRequest_shouldThrowWhenMissing() {
        when(parcelRequestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancelRequest(99L, sender))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    private CreateParcelRequestRequest request(String departure, String destination) {
        CreateParcelRequestRequest request = new CreateParcelRequestRequest();
        request.setDeparture(departure);
        request.setDestination(destination);
        request.setDesiredDate(LocalDate.of(2026, 7, 1));
        request.setPackageTitle(" Documents administratifs ");
        request.setWeight(BigDecimal.valueOf(2.5));
        request.setDescription(" Petit colis fragile ");
        request.setPackagePhotoUrl("/uploads/box.png");
        return request;
    }

    private ParcelRequest parcelRequest(Long id, User sender, String departure, String destination, LocalDate desiredDate) {
        return ParcelRequest.builder()
                .id(id)
                .sender(sender)
                .departure(departure)
                .normalizedDeparture(departure.toLowerCase())
                .destination(destination)
                .normalizedDestination(destination.toLowerCase())
                .desiredDate(desiredDate)
                .packageTitle("Documents")
                .weight(BigDecimal.ONE)
                .status(ParcelRequest.ParcelRequestStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private User user(Long id, String firstName, String lastName) {
        return User.builder()
                .id(id)
                .firstName(firstName)
                .lastName(lastName)
                .email(firstName.toLowerCase() + "@example.com")
                .role(User.Role.USER)
                .build();
    }
}
