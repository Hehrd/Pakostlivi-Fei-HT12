package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.controller.dtos.request.food.CreateFoodRequestDto;
import com.mischievous.fairies.controller.dtos.request.food.UpdateFoodRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.food.FoodResponseDto;
import com.mischievous.fairies.persistence.model.AllergenEntity;
import com.mischievous.fairies.persistence.model.FoodEntity;
import com.mischievous.fairies.persistence.model.FoodTagEntity;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.repository.AllergenRepository;
import com.mischievous.fairies.persistence.repository.FoodRepository;
import com.mischievous.fairies.persistence.repository.FoodTagRepository;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import com.mischievous.fairies.persistence.status.AccountRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class FoodService {
    private final RestaurantRepository restaurantRepository;
    private final FoodRepository foodRepository;
    private final AllergenRepository allergenRepository;
    private final FoodTagRepository foodTagRepository;

    @Autowired
    public FoodService(
            RestaurantRepository restaurantRepository,
            FoodRepository foodRepository,
            AllergenRepository allergenRepository,
            FoodTagRepository foodTagRepository
    ) {
        this.restaurantRepository = restaurantRepository;
        this.foodRepository = foodRepository;
        this.allergenRepository = allergenRepository;
        this.foodTagRepository = foodTagRepository;
    }

    public FoodResponseDto createFood(CreateFoodRequestDto request, Authentication authentication) {
       AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
       if (!authenticatedUser.role().equals(AccountRole.RESTAURANT)) {
           throw new AccessDeniedException("You are not allowed to access this resource");
       }
        RestaurantEntity restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + request.getRestaurantId()));
        FoodEntity food = new FoodEntity();
        food.setRestaurant(restaurant);
        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setAllergens(resolveAllergens(request.getAllergenIds()));
        food.setFoodTags(resolveFoodTags(request.getFoodTagIds()));
        return toResponseDto(foodRepository.save(food));
    }

    public PagedResponse<FoodResponseDto> getAllFoods(Pageable pageable) {
        Page<FoodEntity> foods = foodRepository.findAll(pageable);
        List<FoodResponseDto> dtos = new ArrayList<>();
        for (FoodEntity food : foods) {
            dtos.add(toResponseDto(food));
        }
        PagedResponse<FoodResponseDto> response = new PagedResponse<>();
        response.setData(dtos);
        response.setPage(foods.getNumber());
        response.setSize(foods.getSize());
        response.setTotal(foods.getTotalPages());
        response.setTotalPages(foods.getTotalPages());
        return response;
    }

    public FoodResponseDto getFoodById(Long id) {
        FoodEntity food = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food not found with id: " + id));
        return toResponseDto(food);
    }

    public FoodResponseDto updateFood(UpdateFoodRequestDto request, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        FoodEntity existingFood = foodRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("Food not found with id: " + request.getId()));

        existingFood.setName(request.getName());
        existingFood.setAllergens(resolveAllergens(request.getAllergenIds()));
        existingFood.setFoodTags(resolveFoodTags(request.getFoodTagIds()));

        return toResponseDto(foodRepository.save(existingFood));
    }

    public void deleteFood(Long id, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        FoodEntity existingFood = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food not found with id: " + id));
        foodRepository.delete(existingFood);
    }

    private FoodResponseDto toResponseDto(FoodEntity food) {
        FoodResponseDto dto = new FoodResponseDto();
        dto.setId(food.getId());
        dto.setName(food.getName());
        dto.setAllergenIds(food.getAllergens().stream().map(AllergenEntity::getId).toList());
        dto.setFoodTagIds(food.getFoodTags().stream().map(FoodTagEntity::getId).toList());
        return dto;
    }

    private List<AllergenEntity> resolveAllergens(List<Long> allergenIds) {
        if (allergenIds == null || allergenIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<AllergenEntity> allergens = allergenRepository.findAllById(allergenIds);
        if (allergens.size() != allergenIds.size()) {
            throw new IllegalArgumentException("One or more allergens were not found");
        }
        return allergens;
    }

    private List<FoodTagEntity> resolveFoodTags(List<Long> foodTagIds) {
        if (foodTagIds == null || foodTagIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<FoodTagEntity> foodTags = foodTagRepository.findAllById(foodTagIds);
        if (foodTags.size() != foodTagIds.size()) {
            throw new IllegalArgumentException("One or more food tags were not found");
        }
        return foodTags;
    }
}
