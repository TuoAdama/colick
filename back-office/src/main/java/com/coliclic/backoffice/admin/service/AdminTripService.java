package com.coliclic.backoffice.admin.service;

import com.coliclic.backoffice.admin.dto.AdminPage;
import com.coliclic.backoffice.admin.dto.AdminPublishedTripResponse;
import com.coliclic.backoffice.admin.dto.AdminTripBookingDetailResponse;
import com.coliclic.backoffice.admin.dto.AdminTripBookingResponse;
import com.coliclic.backoffice.admin.dto.AdminTripDetailResponse;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.file.FileStorageService;
import com.coliclic.backoffice.trip.entity.Trip;
import com.coliclic.backoffice.trip.entity.TripBooking;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class AdminTripService {
    private final TripRepository trips;
    private final TripBookingRepository bookings;
    private final FileStorageService storage;

    public AdminTripService(TripRepository trips, TripBookingRepository bookings, FileStorageService storage) {
        this.trips = trips;
        this.bookings = bookings;
        this.storage = storage;
    }

    public AdminPage<AdminPublishedTripResponse> trips(int page, int size, String sort, LocalDate createdFrom, String query) {
        Sort.Direction direction = switch (sort) {
            case null -> Sort.Direction.DESC;
            case "created_asc" -> Sort.Direction.ASC;
            case "created_desc" -> Sort.Direction.DESC;
            default -> throw new BadRequestException("Tri par date de création invalide.");
        };
        var order = Sort.by(direction, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));
        var start = createdFrom == null ? null : createdFrom.atStartOfDay();
        var q = query.strip().toLowerCase(Locale.ROOT);
        return AdminPage.from(trips.findAllForAdmin(start, q, AdminPagination.of(page, size).withSort(order))
                .map(AdminPublishedTripResponse::from));
    }

    public AdminTripDetailResponse detail(Long id) {
        Trip trip = trips.findById(id).orElseThrow(() -> new ResourceNotFoundException("Trajet introuvable."));
        BigDecimal availableWeight = trip.getStatus() == Trip.TripStatus.ACTIVE
                ? trip.getMaxWeight().subtract(bookings.sumWeightByTripAndStatus(id, TripBooking.BookingStatus.ACCEPTED)
                        .orElse(BigDecimal.ZERO))
                : null;
        return new AdminTripDetailResponse(AdminPublishedTripResponse.from(trip), trip.getMeetingPoint(),
                trip.isInstantAcceptance(), availableWeight);
    }

    public AdminPage<AdminTripBookingResponse> bookings(Long id, int page, int size) {
        var pagination = AdminPagination.of(page, size);
        if (!trips.existsById(id)) {
            throw new ResourceNotFoundException("Trajet introuvable.");
        }
        return AdminPage.from(bookings.findByTripForAdmin(id, pagination).map(AdminTripBookingResponse::from));
    }

    public AdminTripBookingDetailResponse booking(Long id, Long bookingId) {
        TripBooking booking = requireBooking(id, bookingId);
        return new AdminTripBookingDetailResponse(AdminTripBookingResponse.from(booking), id,
                booking.getTrip().getReference(), booking.getDescription(), booking.getRecipientContact(),
                storage.findBookingPhoto(booking.getPackagePhotoUrl()) != null, booking.getDeliveredAt());
    }

    public Path photo(Long id, Long bookingId) {
        TripBooking booking = requireBooking(id, bookingId);
        Path photo = storage.findBookingPhoto(booking.getPackagePhotoUrl());
        if (photo == null) {
            throw new ResourceNotFoundException("Photo du colis introuvable.");
        }
        return photo;
    }

    private TripBooking requireBooking(Long tripId, Long bookingId) {
        return bookings.findByIdAndTripId(bookingId, tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Réservation introuvable."));
    }
}
