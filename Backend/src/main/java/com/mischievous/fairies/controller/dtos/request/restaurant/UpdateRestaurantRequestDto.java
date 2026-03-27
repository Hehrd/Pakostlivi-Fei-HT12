package com.mischievous.fairies.controller.dtos.request.restaurant;

import lombok.Data;

@Data
public class UpdateRestaurantRequestDto {
    private Long id;
    private String name;
    private String googleMapsLink;
    private double longitude;
    private double latitude;
}

