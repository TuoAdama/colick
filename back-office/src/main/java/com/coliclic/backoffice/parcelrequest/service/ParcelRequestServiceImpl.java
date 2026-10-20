package com.coliclic.backoffice.parcelrequest.service;

import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.file.FileStorageService;
import com.coliclic.backoffice.i18n.LocalizedMessages;
import com.coliclic.backoffice.parcelrequest.dto.CreateParcelRequestRequest;
import com.coliclic.backoffice.parcelrequest.dto.ParcelRequestResponse;
import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.parcelrequest.repository.ParcelRequestRepository;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coliclic.backoffice.exception.ConflictException;
import java.util.List;

@Service
@Transactional
public class ParcelRequestServiceImpl implements ParcelRequestService {

    private final ParcelRequestRepository parcelRequestRepository;
    private final FileStorageService fileStorageService;
    private final LocalizedMessages localizedMessages;

    public ParcelRequestServiceImpl(ParcelRequestRepository parcelRequestRepository,
                                    FileStorageService fileStorageService,
                                    LocalizedMessages localizedMessages) {
        this.parcelRequestRepository = parcelRequestRepository;
        this.fileStorageService = fileStorageService;
        this.localizedMessages = localizedMessages;
    }

    @Override
    public ParcelRequestResponse createRequest(CreateParcelRequestRequest request, User sender) {
        String departure = normalizeDisplayValue(request.getDeparture());
        String destination = normalizeDisplayValue(request.getDestination());

        ParcelRequest parcelRequest = ParcelRequest.builder()
                .sender(sender)
                .departure(departure)
                .normalizedDeparture(normalizeSearchValue(departure))
                .destination(destination)
                .normalizedDestination(normalizeSearchValue(destination))
                .desiredDate(request.getDesiredDate())
                .packageTitle(normalizeDisplayValue(request.getPackageTitle()))
                .weight(request.getWeight())
                .description(normalizeOptionalText(request.getDescription()))
                .packagePhotoUrl(fileStorageService.sanitizePublicUrl(request.getPackagePhotoUrl()))
                .build();

        return ParcelRequestResponse.from(parcelRequestRepository.save(parcelRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParcelRequestResponse> getAvailableRequests(String departure,
                                                            String destination,
                                                            LocalDate date,
                                                            @Nullable User currentUser) {
        String normalizedDeparture = normalizeOptionalSearchValue(departure);
        String normalizedDestination = normalizeOptionalSearchValue(destination);

        return parcelRequestRepository.findByStatusOrderByCreatedAtDesc(ParcelRequest.ParcelRequestStatus.ACTIVE)
                .stream()
                .filter(request -> request.getDeletedAt() == null)
                .filter(request -> currentUser == null
                        || !request.getSender().getId().equals(currentUser.getId()))
                .filter(request -> matches(request.getNormalizedDeparture(), normalizedDeparture))
                .filter(request -> matches(request.getNormalizedDestination(), normalizedDestination))
                .filter(request -> date == null || date.equals(request.getDesiredDate()))
                .map(ParcelRequestResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParcelRequestResponse> getMyRequests(User sender) {
        return parcelRequestRepository.findBySenderOrderByCreatedAtDesc(sender).stream()
                .filter(request -> request.getDeletedAt() == null)
                .map(ParcelRequestResponse::from)
                .toList();
    }

    @Override
    public ParcelRequestResponse closeRequest(Long requestId, User sender) {
        ParcelRequest request = findOwnedRequest(requestId, sender);
        requireActive(request);
        request.setStatus(ParcelRequest.ParcelRequestStatus.CLOSED);
        return ParcelRequestResponse.from(parcelRequestRepository.save(request));
    }

    @Override
    public void cancelRequest(Long requestId, User sender) {
        ParcelRequest request = findOwnedRequest(requestId, sender);
        requireActive(request);
        request.setStatus(ParcelRequest.ParcelRequestStatus.CANCELLED);
        parcelRequestRepository.save(request);
    }

    @Override
    public ParcelRequestResponse uploadPhoto(Long requestId, MultipartFile file, User sender) {
        ParcelRequest request = findOwnedRequest(requestId, sender);
        requireActive(request);
        request.setPackagePhotoUrl(fileStorageService.store(file));
        return ParcelRequestResponse.from(parcelRequestRepository.save(request));
    }

    @Override
    @Transactional(readOnly = true)
    public ParcelRequestResponse getRequest(Long requestId, User sender) {
        return ParcelRequestResponse.from(findOwnedRequest(requestId, sender));
    }

    @Override
    public ParcelRequestResponse updateRequest(Long requestId, CreateParcelRequestRequest body, User sender) {
        ParcelRequest request = findOwnedRequest(requestId, sender);
        requireActive(request);
        String departure = normalizeDisplayValue(body.getDeparture());
        String destination = normalizeDisplayValue(body.getDestination());
        request.setDeparture(departure);
        request.setNormalizedDeparture(normalizeSearchValue(departure));
        request.setDestination(destination);
        request.setNormalizedDestination(normalizeSearchValue(destination));
        request.setDesiredDate(body.getDesiredDate());
        request.setPackageTitle(normalizeDisplayValue(body.getPackageTitle()));
        request.setWeight(body.getWeight());
        request.setDescription(normalizeOptionalText(body.getDescription()));
        return ParcelRequestResponse.from(parcelRequestRepository.save(request));
    }

    @Override
    public void removeRequest(Long requestId, User sender) {
        ParcelRequest request = findOwnedRequest(requestId, sender);
        request.setDeletedAt(LocalDateTime.now());
        parcelRequestRepository.save(request);
    }

    private void requireActive(ParcelRequest request) {
        if (request.getStatus() != ParcelRequest.ParcelRequestStatus.ACTIVE) {
            throw new ConflictException(localizedMessages.get("error.parcelRequest.inactive"));
        }
    }

    private ParcelRequest findOwnedRequest(Long requestId, User sender) {
        ParcelRequest request = parcelRequestRepository.findById(requestId)
                .filter(found -> found.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException(
                        localizedMessages.get("error.parcelRequest.notFound", requestId)));
        if (!request.getSender().getId().equals(sender.getId())) {
            throw new AccessDeniedException(localizedMessages.get("error.auth.forbidden"));
        }
        return request;
    }

    private boolean matches(String requestValue, String filterValue) {
        return filterValue == null
                || requestValue.contains(filterValue)
                || filterValue.contains(requestValue);
    }

    private String normalizeDisplayValue(String value) {
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return normalizeDisplayValue(value);
    }

    private String normalizeOptionalSearchValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return normalizeSearchValue(value);
    }

    private String normalizeSearchValue(String value) {
        return normalizeDisplayValue(value).toLowerCase();
    }
}
