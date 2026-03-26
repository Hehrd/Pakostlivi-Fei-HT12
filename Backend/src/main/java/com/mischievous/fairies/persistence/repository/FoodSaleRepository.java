package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.FoodSaleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FoodSaleRepository extends JpaRepository<FoodSaleEntity, Long> {

}
