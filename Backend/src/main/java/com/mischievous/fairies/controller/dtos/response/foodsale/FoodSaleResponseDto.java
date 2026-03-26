package com.mischievous.fairies.controller.dtos.response.foodsale;

import lombok.Data;

import java.sql.Date;

@Data
public class FoodSaleResponseDto {
    private Long id;
    private Long foodId;
    private Long price;
    private Date issuedAt;
    private Date expiresAt;
}

