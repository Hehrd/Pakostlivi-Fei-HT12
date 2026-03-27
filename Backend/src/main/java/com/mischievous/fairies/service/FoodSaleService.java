package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.controller.dtos.request.foodsale.CreateFoodSaleRequestDto;
import com.mischievous.fairies.controller.dtos.request.foodsale.UpdateFoodSaleRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.foodsale.FoodSaleResponseDto;
import com.mischievous.fairies.persistence.model.FoodEntity;
import com.mischievous.fairies.persistence.model.FoodSaleEntity;
import com.mischievous.fairies.persistence.repository.FoodRepository;
import com.mischievous.fairies.persistence.repository.FoodSaleRepository;
import com.mischievous.fairies.persistence.status.AccountRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FoodSaleService {
    private final FoodSaleRepository foodSaleRepository;
    private final FoodRepository foodRepository;

    public FoodSaleService(FoodSaleRepository foodSaleRepository, FoodRepository foodRepository) {
        this.foodSaleRepository = foodSaleRepository;
        this.foodRepository = foodRepository;
    }

    public FoodSaleResponseDto createFoodSale(CreateFoodSaleRequestDto request, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        FoodSaleEntity foodSale = new FoodSaleEntity();
        foodSale.setFood(resolveFood(request.getFoodId()));
        foodSale.setPrice(request.getPrice());
        foodSale.setIssuedAt(request.getIssuedAt());
        foodSale.setExpiresAt(request.getExpiresAt());
        return toResponseDto(foodSaleRepository.save(foodSale));
    }

    public PagedResponse<FoodSaleResponseDto> getAllFoodSales(Pageable pageable) {
        Page<FoodSaleEntity> foodSaleEntities = foodSaleRepository.findAll(pageable);
        List<FoodSaleResponseDto> dtos = new ArrayList<>();
        for (FoodSaleEntity entity : foodSaleEntities.getContent()) {
            dtos.add(toResponseDto(entity));
        }
        PagedResponse<FoodSaleResponseDto> response = new PagedResponse<>();
        response.setData(dtos);
        response.setPage(foodSaleEntities.getNumber());
        response.setSize(foodSaleEntities.getSize());
        response.setTotal(foodSaleEntities.getNumberOfElements());
        response.setTotalPages(foodSaleEntities.getTotalPages());
        return response;
    }

    public FoodSaleResponseDto getFoodSaleById(Long id) {
        FoodSaleEntity foodSale = foodSaleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food sale not found with id: " + id));
        return toResponseDto(foodSale);
    }

    public FoodSaleResponseDto updateFoodSale(UpdateFoodSaleRequestDto request, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        FoodSaleEntity existingFoodSale = foodSaleRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("Food sale not found with id: " + request.getId()));

        existingFoodSale.setFood(resolveFood(request.getFoodId()));
        existingFoodSale.setPrice(request.getPrice());
        existingFoodSale.setIssuedAt(request.getIssuedAt());
        existingFoodSale.setExpiresAt(request.getExpiresAt());

        return toResponseDto(foodSaleRepository.save(existingFoodSale));
    }

    public void deleteFoodSale(Long id, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        FoodSaleEntity existingFoodSale = foodSaleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food sale not found with id: " + id));
        foodSaleRepository.delete(existingFoodSale);
    }

    private FoodEntity resolveFood(Long foodId) {
        return foodRepository.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("Food not found with id: " + foodId));
    }

    private FoodSaleResponseDto toResponseDto(FoodSaleEntity foodSale) {
        FoodSaleResponseDto dto = new FoodSaleResponseDto();
        dto.setId(foodSale.getId());
        dto.setFoodId(foodSale.getFood().getId());
        dto.setPrice(foodSale.getPrice());
        dto.setIssuedAt(foodSale.getIssuedAt());
        dto.setExpiresAt(foodSale.getExpiresAt());
        return dto;
    }

    public List<FoodSaleResponseDto> getFoodSalesByRestaurantId(Long restaurantId) {
        List<FoodSaleEntity> foodSales = foodSaleRepository.findAllByFood_Restaurant_Id(restaurantId);
        List<FoodSaleResponseDto> dtos = new ArrayList<>();
        for (FoodSaleEntity entity : foodSales) {
            dtos.add(toResponseDto(entity));
        }
        return dtos;
    }
}
