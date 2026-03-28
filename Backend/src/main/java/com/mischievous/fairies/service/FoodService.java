package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.common.CustomException;
import com.mischievous.fairies.common.exceptions.FoodTagNotFoundException;
import com.mischievous.fairies.common.exceptions.UnsupportedFoodTagException;
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
import com.mischievous.fairies.persistence.status.FoodTagType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.Collections;
import java.util.List;

@Service
public class FoodService {
    private final RestaurantRepository restaurantRepository;
    private final FoodRepository foodRepository;
    private final AllergenRepository allergenRepository;
    private final FoodTagRepository foodTagRepository;
    private final TagGenerationClient tagGenerationClient;
    private final RestaurantEmbeddingRedisService restaurantEmbeddingRedisService;

    @Autowired
    public FoodService(
            RestaurantRepository restaurantRepository,
            FoodRepository foodRepository,
            AllergenRepository allergenRepository,
            FoodTagRepository foodTagRepository,
            TagGenerationClient tagGenerationClient,
            RestaurantEmbeddingRedisService restaurantEmbeddingRedisService
    ) {
        this.restaurantRepository = restaurantRepository;
        this.foodRepository = foodRepository;
        this.allergenRepository = allergenRepository;
        this.foodTagRepository = foodTagRepository;
        this.tagGenerationClient = tagGenerationClient;
        this.restaurantEmbeddingRedisService = restaurantEmbeddingRedisService;
    }

    @Transactional
    public FoodResponseDto createFood(CreateFoodRequestDto request, Authentication authentication) {
       AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
       if (!authenticatedUser.role().equals(AccountRole.RESTAURANT) && !authenticatedUser.role().equals(AccountRole.ADMIN)) {
           throw new AccessDeniedException("You are not allowed to access this resource");
       }
        RestaurantEntity restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + request.getRestaurantId()));
        assertRestaurantAccess(restaurant, authenticatedUser);
        FoodEntity food = new FoodEntity();
        food.setRestaurant(restaurant);
        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setAllergens(resolveAllergens(request.getAllergenIds()));
        food.setFoodTags(resolveGeneratedFoodTags(request.getName(), request.getDescription()));
        FoodEntity savedFood = foodRepository.save(food);
        restaurantEmbeddingRedisService.refreshRestaurant(restaurant.getId());
        return toResponseDto(savedFood);
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
        response.setTotal((int) foods.getTotalElements());
        response.setTotalPages(foods.getTotalPages());
        return response;
    }

    public FoodResponseDto getFoodById(Long id) {
        FoodEntity food = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food not found with id: " + id));
        return toResponseDto(food);
    }

    @Transactional
    public FoodResponseDto updateFood(UpdateFoodRequestDto request, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT) && !authenticatedUser.role().equals(AccountRole.ADMIN)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        FoodEntity existingFood = foodRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("Food not found with id: " + request.getId()));
        assertRestaurantAccess(existingFood.getRestaurant(), authenticatedUser);

        existingFood.setName(request.getName());
        existingFood.setDescription(request.getDescription());
        existingFood.setAllergens(resolveAllergens(request.getAllergenIds()));
        existingFood.setFoodTags(resolveGeneratedFoodTags(request.getName(), request.getDescription()));

        FoodEntity updatedFood = foodRepository.save(existingFood);
        restaurantEmbeddingRedisService.refreshRestaurant(existingFood.getRestaurant().getId());
        return toResponseDto(updatedFood);
    }

    @Transactional
    public void deleteFood(Long id, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT) && !authenticatedUser.role().equals(AccountRole.ADMIN)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        FoodEntity existingFood = foodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food not found with id: " + id));
        assertRestaurantAccess(existingFood.getRestaurant(), authenticatedUser);
        Long restaurantId = existingFood.getRestaurant().getId();
        foodRepository.delete(existingFood);
        restaurantEmbeddingRedisService.refreshRestaurant(restaurantId);
    }

    private FoodResponseDto toResponseDto(FoodEntity food) {
        FoodResponseDto dto = new FoodResponseDto();
        dto.setId(food.getId());
        dto.setRestaurantId(food.getRestaurant().getId());
        dto.setName(food.getName());
        dto.setDescription(food.getDescription());
        dto.setAllergenIds(food.getAllergens().stream().map(AllergenEntity::getId).toList());
        dto.setFoodTagIds(food.getFoodTags().stream().map(FoodTagEntity::getId).toList());
        return dto;
    }

    private void assertRestaurantAccess(RestaurantEntity restaurant, AuthenticatedUser authenticatedUser) {
        if (authenticatedUser.role().equals(AccountRole.ADMIN)) {
            return;
        }

        if (restaurant.getOwner() != null && restaurant.getOwner().getId().equals(authenticatedUser.userId())) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to access this resource");
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

    private List<FoodTagEntity> resolveGeneratedFoodTags(String name, String description) {
        List<String> generatedTags = tagGenerationClient.generateTags(name, description);
        EnumSet<FoodTagType> requestedTypes = EnumSet.noneOf(FoodTagType.class);

        for (String generatedTag : generatedTags) {
            try {
                requestedTypes.add(FoodTagType.valueOf(generatedTag.trim().toUpperCase()));
            } catch (RuntimeException ex) {
                throw new UnsupportedFoodTagException("Fast api generated invalid food tag");
            }
        }

        List<FoodTagEntity> foodTags = foodTagRepository.findByTypeIn(requestedTypes);
        if (foodTags.size() != requestedTypes.size()) {
            throw new FoodTagNotFoundException("food tag or tags were not found");
        }
        return foodTags;
    }
}
