package com.mischievous.fairies.controller.dtos.request.food;

import lombok.Data;

import java.util.List;

@Data
public class UpdateFoodRequestDto {
    private Long id;
    private String name;
    private String description;
    private List<Long> allergenIds;
    private List<Long> foodTagIds;
}

