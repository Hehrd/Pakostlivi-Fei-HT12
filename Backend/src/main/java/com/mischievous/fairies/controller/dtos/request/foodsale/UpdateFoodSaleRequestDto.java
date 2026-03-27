package com.mischievous.fairies.controller.dtos.request.foodsale;

import lombok.Data;

import java.sql.Date;
import java.time.Instant;

@Data
public class UpdateFoodSaleRequestDto {
    private Long id;
    private Long foodId;
    private Long price;
    private Instant issuedAt;
    private Instant expiresAt;
}

