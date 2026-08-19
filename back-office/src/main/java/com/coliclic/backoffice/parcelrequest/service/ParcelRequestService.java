package com.coliclic.backoffice.parcelrequest.service;

import com.coliclic.backoffice.parcelrequest.dto.CreateParcelRequestRequest;
import com.coliclic.backoffice.parcelrequest.dto.ParcelRequestResponse;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public interface ParcelRequestService {

    ParcelRequestResponse createRequest(CreateParcelRequestRequest request, User sender);

    List<ParcelRequestResponse> getAvailableRequests(String departure, String destination, LocalDate date, User currentUser);

    List<ParcelRequestResponse> getMyRequests(User sender);

    ParcelRequestResponse closeRequest(Long requestId, User sender);

    void cancelRequest(Long requestId, User sender);

    ParcelRequestResponse uploadPhoto(Long requestId, MultipartFile file, User sender);
}
