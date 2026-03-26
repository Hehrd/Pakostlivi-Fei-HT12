package com.mischievous.fairies.persistence.repository;


import com.mischievous.fairies.persistence.model.JwtEntity;
import com.mischievous.fairies.persistence.model.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface JwtRepository extends JpaRepository<JwtEntity, Integer> {
    Optional<JwtEntity> findByJti(String jti);
    List<JwtEntity> findAllByUserAccountAndRevokedFalse(AccountEntity userAccount);
    void deleteAllByUserAccount(AccountEntity userAccount);
    void deleteAllByExpiresAtBefore(Instant instant);
}
