package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.StripeAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StripeAccountRepository extends JpaRepository<StripeAccountEntity, Long> {
    StripeAccountEntity findByRestaurant_Id(Long restaurantId);
}
