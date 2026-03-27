package com.mischievous.fairies.controller.dtos.request.restaurant;

import com.mischievous.fairies.controller.dtos.request.user.SignUpReqDTO;
import lombok.Data;

@Data
public class CreateRestaurantRequestDto {
     private SignUpReqDTO signUpReqDTO;
     private RestaurantCreateData restaurantCreateData;

     @Data
     public class RestaurantCreateData {
         private String name;
         private String googleMapsLink;
         private double longitude;
         private double latitude;
     }
}

