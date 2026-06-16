package com.colick.backoffice.parcelrequest.repository;

import com.colick.backoffice.parcelrequest.entity.ParcelRequest;
import com.colick.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParcelRequestRepository extends JpaRepository<ParcelRequest, Long> {

    List<ParcelRequest> findBySenderOrderByCreatedAtDesc(User sender);

    List<ParcelRequest> findByStatusOrderByCreatedAtDesc(ParcelRequest.ParcelRequestStatus status);
}
