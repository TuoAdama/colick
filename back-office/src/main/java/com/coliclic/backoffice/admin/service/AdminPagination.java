package com.coliclic.backoffice.admin.service;

import com.coliclic.backoffice.exception.BadRequestException;
import org.springframework.data.domain.PageRequest;

final class AdminPagination {
    private AdminPagination() {}

    static PageRequest of(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BadRequestException("La page doit être positive ou nulle et la taille comprise entre 1 et 100.");
        }
        return PageRequest.of(page, size);
    }
}
