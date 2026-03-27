package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.restaurant.CreateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.UpdateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.restaurant.RestaurantResponseDto;
import com.mischievous.fairies.service.RestaurantService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
            @RequestBody CreateRestaurantRequestDto request,
            Authentication authentication) {

        RestaurantResponseDto response =
                restaurantService.createRestaurant(request, authentication);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/by-owner")
    public ResponseEntity<PagedResponse<RestaurantResponseDto>> getRestaurantsByOwnerId(Pageable pageable,
                                                                               Authentication authentication) {
        PagedResponse<RestaurantResponseDto> restaurants = restaurantService.getRestaurantsByOwnerId(authentication, pageable);
        return ResponseEntity.ok(restaurants);

    }

    @GetMapping
    public ResponseEntity<PagedResponse<RestaurantResponseDto>> getAllRestaurants(Pageable pageable) {
        PagedResponse<RestaurantResponseDto> restaurants =
                restaurantService.getAllRestaurants(pageable);
        return ResponseEntity.ok(restaurants);
    }

    @GetMapping("/nearby")
    public ResponseEntity<PagedResponse<RestaurantResponseDto>> getAllRestaurants(@RequestParam(name = "lat") double lat,
                                                                                  @RequestParam(name = "lng") double lng,
                                                                                  @RequestParam(name = "radius") double radiusKm,
                                                                                  Pageable pageable) {
        PagedResponse<RestaurantResponseDto> page = restaurantService.getNearbyRestaurants(lat, lng, radiusKm, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantResponseDto> getRestaurantById(@PathVariable(name = "id") Long id) {

        RestaurantResponseDto restaurant =
                restaurantService.getRestaurantById(id);

        return ResponseEntity.ok(restaurant);
    }

    @PutMapping
    public ResponseEntity<RestaurantResponseDto> updateRestaurant(
            @RequestBody UpdateRestaurantRequestDto request,
            Authentication authentication) {

        RestaurantResponseDto updated =
                restaurantService.updateRestaurant(request, authentication);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRestaurant(
            @PathVariable(name = "id") Long id,
            Authentication authentication) {
        restaurantService.deleteRestaurant(id, authentication);
        return ResponseEntity.noContent().build();
    }
}