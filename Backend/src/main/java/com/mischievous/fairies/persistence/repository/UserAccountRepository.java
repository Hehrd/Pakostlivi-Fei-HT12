package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<AccountEntity, Integer> {
    boolean existsByEmail(String email);
    Optional<AccountEntity> findByEmail(String email);
}
