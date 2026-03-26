package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.ClientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<ClientEntity, Long> {
    Optional<ClientEntity> findByAccountEmail(String email);
    Optional<ClientEntity> findByClientId(Long clientId);
}
