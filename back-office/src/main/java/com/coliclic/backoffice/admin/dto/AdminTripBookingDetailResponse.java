package com.coliclic.backoffice.admin.dto;

import java.time.LocalDateTime;

public record AdminTripBookingDetailResponse(AdminTripBookingResponse booking, Long tripId, String tripReference,
                                             String description, String recipientContact, boolean hasPhoto,
                                             LocalDateTime deliveredAt) {}
