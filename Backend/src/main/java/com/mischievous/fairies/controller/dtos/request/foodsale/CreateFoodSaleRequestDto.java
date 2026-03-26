package com.mischievous.fairies.controller.dtos.request.foodsale;

import lombok.Data;

import java.sql.Date;

@Data
public class CreateFoodSaleRequestDto {
    private Long foodId;
    private Long price;
    private Date issuedAt;
    private Date expiresAt;
}

