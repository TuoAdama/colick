package com.coliclic.backoffice.parcelrequest.repository;

import com.coliclic.backoffice.parcelrequest.entity.ParcelRequest;
import com.coliclic.backoffice.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;

@Repository
public interface ParcelRequestRepository extends JpaRepository<ParcelRequest, Long> {

    boolean existsByPackagePhotoUrlIn(Collection<String> references);

    List<ParcelRequest> findBySenderAndDeletedAtIsNullOrderByCreatedAtDesc(User sender);

    List<ParcelRequest> findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(ParcelRequest.ParcelRequestStatus status);
}
