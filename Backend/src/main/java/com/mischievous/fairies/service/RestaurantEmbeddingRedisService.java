package com.mischievous.fairies.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mischievous.fairies.service.dto.embedding.RestaurantEmbeddingDto;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RestaurantEmbeddingRedisService {
    private static final String KEY_PREFIX = "restaurant:embedding:";

    private final RestaurantEmbeddingProjectionService projectionService;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RestaurantEmbeddingRedisService(RestaurantEmbeddingProjectionService projectionService,
                                           StringRedisTemplate stringRedisTemplate) {
        this.projectionService = projectionService;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public void refreshRestaurant(Long restaurantId) {
        RestaurantEmbeddingDto projection = projectionService.buildRestaurantEmbedding(restaurantId);
        stringRedisTemplate.opsForValue().set(buildKey(restaurantId), serialize(projection));
    }

    public void removeRestaurant(Long restaurantId) {
        stringRedisTemplate.delete(buildKey(restaurantId));
    }

    private String buildKey(Long restaurantId) {
        return KEY_PREFIX + restaurantId;
    }

    private String serialize(RestaurantEmbeddingDto projection) {
        try {
            return objectMapper.writeValueAsString(projection);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize restaurant embedding payload", e);
        }
    }
}
