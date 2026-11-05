package com.coliclic.backoffice.admin.dto;

public record AdminUserDetailResponse(AdminUserResponse user, long tripsCount, long bookingsCount) {}
