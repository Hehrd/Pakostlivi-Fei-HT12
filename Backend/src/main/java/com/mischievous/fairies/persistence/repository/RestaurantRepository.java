package com.mischievous.fairies.persistence.repository;

import com.mischievous.fairies.persistence.model.RestaurantEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RestaurantRepository extends JpaRepository<RestaurantEntity, Long> {
    @Query("""
SELECT r
FROM RestaurantEntity r
WHERE r.latitude BETWEEN :minLat AND :maxLat
AND r.longitude BETWEEN :minLng AND :maxLng
""")
    Page<RestaurantEntity> findInBoundingBox(
            double minLat,
            double maxLat,
            double minLng,
            double maxLng,
            Pageable pageable
    );

    Page<RestaurantEntity> findAllByOwner_Id(Long ownerId, Pageable pageable);
}
