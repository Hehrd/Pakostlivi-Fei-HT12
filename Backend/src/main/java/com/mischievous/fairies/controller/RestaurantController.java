package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.restaurant.CreateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.DeleteRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.GetRestaurantByIdRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.UpdateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.restaurant.RestaurantResponseDto;
import com.mischievous.fairies.service.RestaurantService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    @Autowired
    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @PostMapping
    public ResponseEntity<RestaurantResponseDto> createRestaurant(
            @RequestBody CreateRestaurantRequestDto request) {

        RestaurantResponseDto response =
                restaurantService.createRestaurant(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<RestaurantResponseDto>> getAllRestaurants(Pageable pageable) {
        PagedResponse<RestaurantResponseDto> restaurants =
                restaurantService.getAllRestaurants(pageable);
        return ResponseEntity.ok(restaurants);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponseDto> getRestaurantById(@PathVariable(name = "id") Long id) {

        RestaurantResponseDto restaurant =
                restaurantService.getRestaurantById(id);

        return ResponseEntity.ok(restaurant);
    }

    @PutMapping
    public ResponseEntity<RestaurantResponseDto> updateRestaurant(
            @RequestBody UpdateRestaurantRequestDto request) {

        RestaurantResponseDto updated =
                restaurantService.updateRestaurant(request);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestaurant(
            @PathVariable(name = "id") Long id) {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.noContent().build();
    }
}