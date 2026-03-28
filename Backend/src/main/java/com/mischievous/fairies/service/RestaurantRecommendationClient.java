package com.mischievous.fairies.service;

import com.mischievous.fairies.common.CustomException;
import com.mischievous.fairies.service.dto.recommendation.RecommendRestaurantsClientRequestDto;
import com.mischievous.fairies.service.dto.recommendation.RecommendRestaurantsClientResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

@Service
public class RestaurantRecommendationClient {
    private final RestClient fastApiRestClient;

    public RestaurantRecommendationClient(RestClient fastApiRestClient) {
        this.fastApiRestClient = fastApiRestClient;
    }

    public List<Long> recommendRestaurants(Long customerId, List<Long> restaurantIds) {
        try {
            RecommendRestaurantsClientResponseDto body = fastApiRestClient.post()
                    .uri("/recommend")
                    .body(new RecommendRestaurantsClientRequestDto(customerId, restaurantIds, 10, 5))
                    .retrieve()
                    .body(RecommendRestaurantsClientResponseDto.class);

            if (body == null || body.getRestaurantIds() == null) {
                throw new CustomException("FastAPI recommendation returned no restaurant ids", HttpStatus.BAD_GATEWAY);
            }

            return body.getRestaurantIds();
        } catch (RestClientException e) {
            throw new CustomException("Failed to fetch restaurant recommendations from FastAPI", HttpStatus.BAD_GATEWAY);
        }
    }
}
