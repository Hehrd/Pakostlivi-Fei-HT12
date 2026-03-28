package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.food.CreateFoodRequestDto;
import com.mischievous.fairies.controller.dtos.request.food.UpdateFoodRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.food.FoodResponseDto;
import com.mischievous.fairies.service.FoodService;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/foods")
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @PostMapping
    public ResponseEntity<FoodResponseDto> createFood(
            @RequestBody CreateFoodRequestDto request,
            Authentication authentication) {

        FoodResponseDto response = foodService.createFood(request, authentication);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<FoodResponseDto>> getAllFoods(Pageable pageable) {
        PagedResponse<FoodResponseDto> foods = foodService.getAllFoods(pageable);
        return ResponseEntity.ok(foods);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FoodResponseDto> getFoodById(
            @PathVariable Long id) {

        FoodResponseDto food = foodService.getFoodById(id);

        return ResponseEntity.ok(food);
    }

    @PutMapping
    public ResponseEntity<FoodResponseDto> updateFood(
            @RequestBody UpdateFoodRequestDto request,
            Authentication authentication) {

        FoodResponseDto updated = foodService.updateFood(request, authentication);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFood(
            @PathVariable(name = "id") Long id,
            Authentication authentication) {
        foodService.deleteFood(id, authentication);

        return ResponseEntity.noContent().build();
    }
}