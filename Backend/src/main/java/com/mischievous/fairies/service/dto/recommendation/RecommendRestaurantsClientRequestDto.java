package com.mischievous.fairies.service.dto.recommendation;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class RecommendRestaurantsClientRequestDto {
    private Long customerId;
    private List<Long> restaurantIds;
    private int k;
    private int limit;
}
