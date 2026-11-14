package com.coliclic.backoffice.admin.service;

import com.coliclic.backoffice.admin.dto.*;
import com.coliclic.backoffice.exception.BadRequestException;
import com.coliclic.backoffice.exception.ResourceNotFoundException;
import com.coliclic.backoffice.trip.repository.TripBookingRepository;
import com.coliclic.backoffice.trip.repository.TripRepository;
import com.coliclic.backoffice.user.entity.User;
import com.coliclic.backoffice.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

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
        Page<User> userPage = users.searchForAdmin(query.trim().toLowerCase(Locale.ROOT), pagination(page, size));
        List<Long> userIds = userPage.getContent().stream().map(User::getId).toList();
        if (userIds.isEmpty()) {
            return AdminPage.from(userPage.map(user -> AdminUserResponse.from(user, 0, 0)));
        }

        Map<Long, Long> tripsByUser = trips.countAdminTripsByUserIds(userIds).stream()
                .collect(Collectors.toMap(AdminActivityCount::getUserId, AdminActivityCount::getActivityCount));
        Map<Long, Long> bookingsByUser = bookings.countAdminBookingsByUserIds(userIds).stream()
                .collect(Collectors.toMap(AdminActivityCount::getUserId, AdminActivityCount::getActivityCount));
        return AdminPage.from(userPage.map(user -> AdminUserResponse.from(user,
                tripsByUser.getOrDefault(user.getId(), 0L), bookingsByUser.getOrDefault(user.getId(), 0L))));
    }

    public AdminUserDetailResponse detail(Long id) {
        User user = requireUser(id);
        long tripsCount = trips.countByTraveler(user);
        long bookingsCount = bookings.countBySender(user);
        return new AdminUserDetailResponse(AdminUserResponse.from(user, tripsCount, bookingsCount), tripsCount,
                bookingsCount);
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
