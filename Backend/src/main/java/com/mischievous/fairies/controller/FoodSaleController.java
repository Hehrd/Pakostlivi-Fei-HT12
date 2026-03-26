package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.foodsale.CreateFoodSaleRequestDto;
import com.mischievous.fairies.controller.dtos.request.foodsale.UpdateFoodSaleRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.foodsale.FoodSaleResponseDto;
import com.mischievous.fairies.service.FoodSaleService;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/food-sales")
public class FoodSaleController {
    private final FoodSaleService foodSaleService;

    public FoodSaleController(FoodSaleService foodSaleService) {
        this.foodSaleService = foodSaleService;
    }

    @PostMapping
    public ResponseEntity<FoodSaleResponseDto> createFoodSale(@RequestBody CreateFoodSaleRequestDto request) {
        FoodSaleResponseDto created = foodSaleService.createFoodSale(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<FoodSaleResponseDto>> getAllFoodSales(Pageable pageable) {
        return ResponseEntity.ok(foodSaleService.getAllFoodSales(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FoodSaleResponseDto> getFoodSaleById(@PathVariable(name = "id") Long id) {
        return ResponseEntity.ok(foodSaleService.getFoodSaleById(id));
    }

    @PutMapping
    public ResponseEntity<FoodSaleResponseDto> updateFoodSale(@RequestBody UpdateFoodSaleRequestDto request) {
        return ResponseEntity.ok(foodSaleService.updateFoodSale(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFoodSale(@PathVariable(name = "id") Long id) {
        foodSaleService.deleteFoodSale(id);
        return ResponseEntity.noContent().build();
    }
}
