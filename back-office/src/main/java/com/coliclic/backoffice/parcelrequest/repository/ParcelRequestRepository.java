package com.coliclic.backoffice.parcelrequest.repository;

import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParcelRequestRepository extends JpaRepository<ParcelRequest, Long> {

    List<ParcelRequest> findBySenderOrderByCreatedAtDesc(User sender);

    List<ParcelRequest> findByStatusOrderByCreatedAtDesc(ParcelRequest.ParcelRequestStatus status);
}
