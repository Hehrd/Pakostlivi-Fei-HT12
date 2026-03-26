package com.mischievous.fairies.controller.dtos.request.food;

import lombok.Data;

import java.util.List;

@Data
public class CreateFoodRequestDto {
    private String name;
    private List<Long> allergenIds;
    private List<Long> foodTagIds;
}

