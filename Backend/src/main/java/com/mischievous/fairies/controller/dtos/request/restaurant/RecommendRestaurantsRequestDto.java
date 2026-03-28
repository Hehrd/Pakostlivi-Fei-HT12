package com.mischievous.fairies.controller.dtos.request.restaurant;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecommendRestaurantsRequestDto {
    @NotNull
    private Double lat;

    @NotNull
    private Double lng;

    @NotNull
    @DecimalMin(value = "0.1")
    private Double radiusKm;
}
