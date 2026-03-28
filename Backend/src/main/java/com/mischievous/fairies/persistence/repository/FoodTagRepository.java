package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.FoodTagEntity;
import com.mischievous.fairies.persistence.status.FoodTagType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FoodTagRepository extends JpaRepository<FoodTagEntity, Long> {
    Optional<FoodTagEntity> findByType(FoodTagType type);

    List<FoodTagEntity> findByTypeIn(Collection<FoodTagType> types);
}

