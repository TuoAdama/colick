package com.coliclic.backoffice.admin.service;

import com.coliclic.backoffice.admin.dto.*;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class AdminUserService {
    private final UserRepository users;
    private final TripRepository trips;
    private final TripBookingRepository bookings;

    public AdminUserService(UserRepository users, TripRepository trips, TripBookingRepository bookings) {
        this.users = users;
        this.trips = trips;
        this.bookings = bookings;
    }

    public AdminPage<AdminUserResponse> users(int page, int size, String query) {
        return AdminPage.from(users.searchForAdmin(query.trim().toLowerCase(Locale.ROOT), pagination(page, size))
                .map(AdminUserResponse::from));
    }

    public AdminUserDetailResponse detail(Long id) {
        User user = requireUser(id);
        return new AdminUserDetailResponse(AdminUserResponse.from(user), trips.countByTraveler(user),
                bookings.countBySender(user));
    }

    public AdminPage<AdminTripResponse> trips(Long id, int page, int size) {
        requireUser(id);
        return AdminPage.from(trips.findAdminHistory(id, pagination(page, size)).map(AdminTripResponse::from));
    }

    public AdminPage<AdminBookingResponse> bookings(Long id, int page, int size) {
        requireUser(id);
        return AdminPage.from(bookings.findAdminHistory(id, pagination(page, size)).map(AdminBookingResponse::from));
    }

    private User requireUser(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
    }

    private PageRequest pagination(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BadRequestException("La page doit être positive ou nulle et la taille comprise entre 1 et 100.");
        }
        return PageRequest.of(page, size);
    }
}
