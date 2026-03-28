package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.ProfileEntity;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<ProfileEntity, Long> {
    @Override
    @Cacheable(cacheNames = "profilesById", key = "#id")
    Optional<ProfileEntity> findById(Long id);

    @Cacheable(cacheNames = "profilesByAccountId", key = "#accountId")
    Optional<ProfileEntity> findByAccount_Id(Long accountId);

    @Override
    @Caching(
            put = {
                    @CachePut(cacheNames = "profilesById", key = "#result.id", unless = "#result == null"),
                    @CachePut(cacheNames = "profilesByAccountId", key = "#result.account.id", unless = "#result == null || #result.account == null")
            }
    )
    <S extends ProfileEntity> S save(S entity);

    @Override
    @Caching(
            evict = {
                    @CacheEvict(cacheNames = "profilesById", key = "#entity.id", beforeInvocation = true),
                    @CacheEvict(cacheNames = "profilesByAccountId", key = "#entity.account.id", beforeInvocation = true)
            }
    )
    void delete(ProfileEntity entity);
}
