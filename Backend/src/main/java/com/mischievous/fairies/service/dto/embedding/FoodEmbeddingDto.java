package com.mischievous.fairies.service.dto.embedding;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class FoodEmbeddingDto {
    private Long foodId;
    private String name;
    private String description;
    private List<String> tags = new ArrayList<>();
    private List<String> allergens = new ArrayList<>();
}
