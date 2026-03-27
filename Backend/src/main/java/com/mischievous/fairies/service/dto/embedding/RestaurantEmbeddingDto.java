package com.mischievous.fairies.service.dto.embedding;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class RestaurantEmbeddingDto {
    private Long restaurantId;
    private String name;
    private List<FoodEmbeddingDto> foods = new ArrayList<>();
}
