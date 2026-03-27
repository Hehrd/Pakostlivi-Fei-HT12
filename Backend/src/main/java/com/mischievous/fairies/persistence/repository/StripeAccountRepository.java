package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.StripeAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StripeAccountRepository extends JpaRepository<StripeAccountEntity, Long> {
    Optional<StripeAccountEntity> findByRestaurant_Id(Long restaurantId);
}
