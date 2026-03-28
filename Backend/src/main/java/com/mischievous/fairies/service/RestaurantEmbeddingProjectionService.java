package com.mischievous.fairies.service;

import com.mischievous.fairies.common.exceptions.RestaurantNotFoundException;
import com.mischievous.fairies.persistence.model.AllergenEntity;
import com.mischievous.fairies.persistence.model.FoodEntity;
import com.mischievous.fairies.persistence.model.FoodTagEntity;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import com.mischievous.fairies.service.dto.embedding.FoodEmbeddingDto;
import com.mischievous.fairies.service.dto.embedding.RestaurantEmbeddingDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RestaurantEmbeddingProjectionService {
    private final RestaurantRepository restaurantRepository;

    public RestaurantEmbeddingProjectionService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @Transactional(readOnly = true)
    public RestaurantEmbeddingDto buildRestaurantEmbedding(Long restaurantId) {
        RestaurantEntity restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException("restaurant not found"));

        RestaurantEmbeddingDto restaurantEmbeddingDto = new RestaurantEmbeddingDto();
        restaurantEmbeddingDto.setRestaurantId(restaurant.getId());
        restaurantEmbeddingDto.setName(restaurant.getName());

        for (FoodEntity food : restaurant.getFoods()) {
            FoodEmbeddingDto foodDto = new FoodEmbeddingDto();
            foodDto.setFoodId(food.getId());
            foodDto.setName(food.getName());

            for (FoodTagEntity foodTag : food.getFoodTags()) {
                foodDto.getTags().add(foodTag.getType().name());
            }

            for (AllergenEntity allergen : food.getAllergens()) {
                foodDto.getAllergens().add(allergen.getType().name());
            }

            restaurantEmbeddingDto.getFoods().add(foodDto);
        }

        return restaurantEmbeddingDto;
    }
}
