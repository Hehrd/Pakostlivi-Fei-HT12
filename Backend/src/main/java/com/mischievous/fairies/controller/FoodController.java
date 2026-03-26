package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.food.CreateFoodRequestDto;
import com.mischievous.fairies.controller.dtos.request.food.DeleteFoodRequestDto;
import com.mischievous.fairies.controller.dtos.request.food.GetFoodByIdRequestDto;
import com.mischievous.fairies.controller.dtos.request.food.UpdateFoodRequestDto;
import com.mischievous.fairies.controller.dtos.response.food.FoodResponseDto;
import com.mischievous.fairies.service.FoodService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/foods")
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @PostMapping
    public ResponseEntity<FoodResponseDto> createFood(
            @RequestBody CreateFoodRequestDto request) {

        FoodResponseDto response = foodService.createFood(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<FoodResponseDto>> getAllFoods() {
        List<FoodResponseDto> foods = foodService.getAllFoods();

        return ResponseEntity.ok(foods);
    }

    @PostMapping("/by-id")
    public ResponseEntity<FoodResponseDto> getFoodById(
            @RequestBody GetFoodByIdRequestDto request) {

        FoodResponseDto food = foodService.getFoodById(request);

        return ResponseEntity.ok(food);
    }

    @PutMapping
    public ResponseEntity<FoodResponseDto> updateFood(
            @RequestBody UpdateFoodRequestDto request) {

        FoodResponseDto updated = foodService.updateFood(request);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteFood(
            @RequestBody DeleteFoodRequestDto request) {

        foodService.deleteFood(request);

        return ResponseEntity.noContent().build();
    }
}