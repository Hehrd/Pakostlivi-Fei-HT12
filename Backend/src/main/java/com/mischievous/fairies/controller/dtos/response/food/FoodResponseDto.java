package com.mischievous.fairies.controller.dtos.response.food;

import lombok.Data;

import java.util.List;

@Data
public class FoodResponseDto {
    private Long id;
    private String name;
    private List<Long> allergenIds;
    private List<Long> foodTagIds;
}

