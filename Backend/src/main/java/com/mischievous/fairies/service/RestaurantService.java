package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.controller.dtos.request.restaurant.CreateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.UpdateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.restaurant.RestaurantResponseDto;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.repository.AccountRepository;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import com.mischievous.fairies.persistence.status.AccountRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RestaurantService {
    private final RestaurantRepository restaurantRepository;
    private final AccountRepository accountRepository;
    private final JwtService jwtService;

    @Autowired
    public RestaurantService(RestaurantRepository restaurantRepository,
                             AccountRepository accountRepository,
                             JwtService jwtService) {
        this.restaurantRepository = restaurantRepository;
        this.accountRepository = accountRepository;
        this.jwtService = jwtService;
    }

    public RestaurantResponseDto createRestaurant(CreateRestaurantRequestDto request, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.ADMIN)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        RestaurantEntity restaurant = new RestaurantEntity();
        restaurant.setName(request.getName());
        restaurant.setGoogleMapsLink(request.getGoogleMapsLink());
        restaurant.setLongitude(request.getLongitude());
        restaurant.setLatitude(request.getLatitude());
        return toResponseDto(restaurantRepository.save(restaurant));
    }

    public PagedResponse<RestaurantResponseDto> getAllRestaurants(Pageable pageable) {
        Page<RestaurantEntity> entities = restaurantRepository.findAll(pageable);
        List<RestaurantResponseDto> dtos = new ArrayList<>();
        for (RestaurantEntity entity : entities.getContent()) {
            dtos.add(toResponseDto(entity));
        }
        PagedResponse<RestaurantResponseDto> response = getPagedRes(dtos, entities);
        return response;
    }

    public RestaurantResponseDto getRestaurantById(Long id) {
        RestaurantEntity restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + id));
        return toResponseDto(restaurant);
    }

    public RestaurantResponseDto updateRestaurant(UpdateRestaurantRequestDto request, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT) && !authenticatedUser.role().equals(AccountRole.ADMIN)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        RestaurantEntity existingRestaurant = restaurantRepository.findById(request.getId())
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + request.getId()));

        existingRestaurant.setName(request.getName());
        existingRestaurant.setGoogleMapsLink(request.getGoogleMapsLink());
        existingRestaurant.setLongitude(request.getLongitude());
        existingRestaurant.setLatitude(request.getLatitude());
        return toResponseDto(restaurantRepository.save(existingRestaurant));
    }

    public void deleteRestaurant(Long id, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT) && !authenticatedUser.role().equals(AccountRole.ADMIN)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        RestaurantEntity existingRestaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + id));
        restaurantRepository.delete(existingRestaurant);
    }

    private RestaurantResponseDto toResponseDto(RestaurantEntity restaurant) {
        RestaurantResponseDto dto = new RestaurantResponseDto();
        dto.setId(restaurant.getId());
        dto.setName(restaurant.getName());
        dto.setGoogleMapsLink(restaurant.getGoogleMapsLink());
        dto.setLongitude(restaurant.getLongitude());
        dto.setLatitude(restaurant.getLatitude());
        return dto;
    }

    public PagedResponse<RestaurantResponseDto> getNearbyRestaurants(
            double lat,
            double lng,
            double radiusKm,
            Pageable pageable
    ) {
        // 1° latitude ≈ 111 km
        double latRange = radiusKm / 111.0;
        double lngRange = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));

        double minLat = lat - latRange;
        double maxLat = lat + latRange;
        double minLng = lng - lngRange;
        double maxLng = lng + lngRange;

        // Step 1: Get all candidates in the bounding box
        Page<RestaurantEntity> candidates =
                restaurantRepository.findInBoundingBox(minLat, maxLat, minLng, maxLng, pageable);

        // Step 2: Sort candidates by exact distance
        List<RestaurantEntity> sorted =
                candidates.getContent().stream()
                        .sorted(Comparator.comparingDouble(r ->
                                distance(lat, lng, r.getLatitude(), r.getLongitude())))
                        .toList();

        // Step 3: Map to DTO and return paged response
        List<RestaurantResponseDto> dtos = new ArrayList<>();
        for (RestaurantEntity entity : sorted) {
            dtos.add(toResponseDto(entity));
        }
        return getPagedRes(dtos, candidates);
    }

    // Haversine formula to calculate distance in km

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) *
                        Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    // Map Page<RestaurantEntity> to PagedResponse<RestaurantResponseDto>



    private PagedResponse<RestaurantResponseDto> getPagedRes(List<RestaurantResponseDto> dtos, Page<RestaurantEntity> entities) {
        PagedResponse<RestaurantResponseDto> response = new PagedResponse<>();
        response.setData(dtos);
        response.setPage(entities.getNumber());
        response.setSize(entities.getSize());
        response.setTotal(entities.getNumberOfElements());
        response.setTotalPages(entities.getTotalPages());
        return response;
    }
}
