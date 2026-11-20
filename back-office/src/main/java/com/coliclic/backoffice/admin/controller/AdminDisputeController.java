package com.coliclic.backoffice.admin.controller;

import com.coliclic.backoffice.admin.dto.AdminPage;
import com.coliclic.backoffice.dispute.DisputeRepository;
import com.coliclic.backoffice.exception.ApiError;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;

@RestController
@RequestMapping("/admin/disputes")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDisputeController {
    private final DisputeRepository disputes;

    public AdminDisputeController(DisputeRepository disputes) {
        this.disputes = disputes;
    }

    @GetMapping
    public AdminPage<DisputeRepository.Summary> list(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BadRequestException("Paramètres de pagination invalides.");
        }
        return AdminPage.from(disputes.findAllBy(PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "receivedAt", "id"))));
    }

    @GetMapping("/{id}")
    public Detail detail(@PathVariable Long id) {
        var dispute = disputes.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Litige introuvable."));
        return new Detail(dispute.getId(), dispute.getReceivedAt(), dispute.getEmail(),
                dispute.getTripReference(), dispute.getBookingReference(), dispute.getDescription());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError invalidParameter() {
        return new ApiError(400, "Paramètre d’administration invalide.");
    }

    public record Detail(Long id, Instant receivedAt, String email, String tripReference,
                         String bookingReference, String description) {
    }
}
