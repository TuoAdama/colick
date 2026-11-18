package com.coliclic.backoffice.admin.dto;

import java.math.BigDecimal;

public record AdminTripDetailResponse(AdminPublishedTripResponse publication, String meetingPoint,
                                      boolean instantAcceptance, BigDecimal availableWeight) {}
