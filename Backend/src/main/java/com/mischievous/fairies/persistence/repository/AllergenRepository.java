package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.AllergenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AllergenRepository extends JpaRepository<AllergenEntity, Long> {
    Optional<AllergenEntity> findByName(String name);
}

