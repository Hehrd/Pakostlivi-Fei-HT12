package com.mischievous.fairies.service;

import com.mischievous.fairies.controller.dtos.request.restaurant.CreateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.DeleteRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.GetRestaurantByIdRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.UpdateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.restaurant.RestaurantResponseDto;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RestaurantService {
    private final RestaurantRepository restaurantRepository;

    @Autowired
    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    public RestaurantResponseDto createRestaurant(CreateRestaurantRequestDto request) {
        RestaurantEntity restaurant = new RestaurantEntity();
        restaurant.setName(request.getName());
        return toResponseDto(restaurantRepository.save(restaurant));
    }

    public PagedResponse<RestaurantResponseDto> getAllRestaurants(Pageable pageable) {
        Page<RestaurantEntity> entities = restaurantRepository.findAll(pageable);
        List<RestaurantResponseDto> dtos = new ArrayList<>();
        for (RestaurantEntity entity : entities.getContent()) {
            dtos.add(toResponseDto(entity));
        }
        PagedResponse<RestaurantResponseDto> response = new PagedResponse<>();
        response.setData(dtos);
        response.setPage(entities.getNumber());
        response.setSize(entities.getSize());
        response.setTotal(entities.getNumberOfElements());
        response.setTotalPages(entities.getTotalPages());
        return response;
    }

    public RestaurantResponseDto getRestaurantById(Long id) {
        RestaurantEntity restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + id));
        return toResponseDto(restaurant);
    }

    public RestaurantResponseDto updateRestaurant(UpdateRestaurantRequestDto request) {
        RestaurantEntity existingRestaurant = restaurantRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + request.getId()));

        existingRestaurant.setName(request.getName());

        return toResponseDto(restaurantRepository.save(existingRestaurant));
    }

    public void deleteRestaurant(Long id) {
        RestaurantEntity existingRestaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + id));
        restaurantRepository.delete(existingRestaurant);
    }

    private RestaurantResponseDto toResponseDto(RestaurantEntity restaurant) {
        RestaurantResponseDto dto = new RestaurantResponseDto();
        dto.setId(restaurant.getId());
        dto.setName(restaurant.getName());
        return dto;
    }
}
