package com.mischievous.fairies.controller.dtos.response.restaurant;

import lombok.Data;

@Data
public class RestaurantResponseDto {
    private Long id;
    private String name;
    private String googleMapsLink;
    private double longitude;
    private double latitude;
    private Long ownerId;
    private String ownerEmail;
    private String ownerFirstName;
    private String ownerLastName;
}

