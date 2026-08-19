package com.coliclic.backoffice.parcelrequest.dto;

import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ParcelRequestResponse {

    private Long id;
    private Long senderId;
    private String senderName;
    private String senderPhotoUrl;
    private String departure;
    private String destination;
    private LocalDate desiredDate;
    private String packageTitle;
    private BigDecimal weight;
    private String description;
    private String packagePhotoUrl;
    private ParcelRequest.ParcelRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ParcelRequestResponse from(ParcelRequest request) {
        return ParcelRequestResponse.builder()
                .id(request.getId())
                .senderId(request.getSender().getId())
                .senderName(request.getSender().getFirstName() + " " + request.getSender().getLastName())
                .senderPhotoUrl(request.getSender().getPhotoUrl())
                .departure(request.getDeparture())
                .destination(request.getDestination())
                .desiredDate(request.getDesiredDate())
                .packageTitle(request.getPackageTitle())
                .weight(request.getWeight())
                .description(request.getDescription())
                .packagePhotoUrl(request.getPackagePhotoUrl())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
