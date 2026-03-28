package com.mischievous.fairies.service.dto.recommendation;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class RecommendRestaurantsClientResponseDto {
    private List<Long> restaurantIds = new ArrayList<>();
}
