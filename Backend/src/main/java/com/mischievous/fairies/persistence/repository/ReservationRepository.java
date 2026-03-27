package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.ReservationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<ReservationEntity, Long> {
    Optional<ReservationEntity> findByPaymentIntentId(String paymentIntentId);

    void deleteByPaymentIntentId(String paymentIntentId);
}
