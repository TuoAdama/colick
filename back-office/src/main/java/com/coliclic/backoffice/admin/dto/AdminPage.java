package com.coliclic.backoffice.admin.dto;

import org.springframework.data.domain.Page;
import java.util.List;

public record AdminPage<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
    public static <T> AdminPage<T> from(Page<T> page) {
        return new AdminPage<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
