package com.mischievous.fairies.controller.dtos.response.foodsale;

import lombok.Data;

import java.sql.Date;
import java.time.Instant;

@Data
public class FoodSaleResponseDto {
    private Long id;
    private Long foodId;
    private Long price;
    private int quantity;
    private Instant issuedAt;
    private Instant expiresAt;
}

