package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.FoodSaleEntity;
import com.mischievous.fairies.persistence.model.ReservationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<ReservationEntity, Long> {
    Optional<ReservationEntity> findByPaymentIntentId(String paymentIntentId);

    void deleteByPaymentIntentId(String paymentIntentId);

    Page<ReservationEntity> findByAccount_Id(Long accountId, Pageable pageable);

    Page<ReservationEntity> findByFoodSaleEntity_Id(Long foodSaleEntityId, Pageable pageable);

    Page<ReservationEntity> findByFoodSaleEntity_Food_Restaurant_Id(Long restaurantId, Pageable pageable);

}
