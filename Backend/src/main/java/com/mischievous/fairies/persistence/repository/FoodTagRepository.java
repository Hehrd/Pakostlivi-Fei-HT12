package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.FoodTagEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FoodTagRepository extends JpaRepository<FoodTagEntity, Long> {
}

