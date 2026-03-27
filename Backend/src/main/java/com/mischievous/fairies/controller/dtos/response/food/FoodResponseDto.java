package com.mischievous.fairies.controller.dtos.response.food;

import lombok.Data;

import java.util.List;

@Data
public class FoodResponseDto {
    private Long id;
    private Long restaurantId;
    private String name;
    private String description;
    private List<Long> allergenIds;
    private List<Long> foodTagIds;
}

