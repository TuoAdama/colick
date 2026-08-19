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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
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
                                                            User currentUser) {
        String normalizedDeparture = normalizeOptionalSearchValue(departure);
        String normalizedDestination = normalizeOptionalSearchValue(destination);

        return parcelRequestRepository.findByStatusOrderByCreatedAtDesc(ParcelRequest.ParcelRequestStatus.ACTIVE)
                .stream()
                .filter(request -> !request.getSender().getId().equals(currentUser.getId()))
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
                .map(ParcelRequestResponse::from)
                .toList();
    }

    @Override
    public ParcelRequestResponse closeRequest(Long requestId, User sender) {
        ParcelRequest request = findOwnedRequest(requestId, sender);
        request.setStatus(ParcelRequest.ParcelRequestStatus.CLOSED);
        return ParcelRequestResponse.from(parcelRequestRepository.save(request));
    }

    @Override
    public void cancelRequest(Long requestId, User sender) {
        ParcelRequest request = findOwnedRequest(requestId, sender);
        request.setStatus(ParcelRequest.ParcelRequestStatus.CANCELLED);
        parcelRequestRepository.save(request);
    }

    @Override
    public ParcelRequestResponse uploadPhoto(Long requestId, MultipartFile file, User sender) {
        ParcelRequest request = findOwnedRequest(requestId, sender);
        request.setPackagePhotoUrl(fileStorageService.store(file));
        return ParcelRequestResponse.from(parcelRequestRepository.save(request));
    }

    private ParcelRequest findOwnedRequest(Long requestId, User sender) {
        ParcelRequest request = parcelRequestRepository.findById(requestId)
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
