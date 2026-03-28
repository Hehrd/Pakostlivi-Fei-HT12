package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.common.exceptions.RestaurantNotFoundException;
import com.mischievous.fairies.controller.dtos.request.restaurant.CreateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.RecommendRestaurantsRequestDto;
import com.mischievous.fairies.controller.dtos.request.restaurant.UpdateRestaurantRequestDto;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.restaurant.RestaurantResponseDto;
import com.mischievous.fairies.persistence.model.AccountEntity;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.model.StripeAccountEntity;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import com.mischievous.fairies.persistence.repository.StripeAccountRepository;
import com.mischievous.fairies.persistence.status.AccountRole;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.param.AccountLinkCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RestaurantService {
    private final AccountService accountService;
    private final StripeService stripeService;
    private final StripeAccountRepository stripeAccountRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantEmbeddingRedisService restaurantEmbeddingRedisService;
    private final RestaurantRecommendationClient restaurantRecommendationClient;

    @Autowired
    public RestaurantService(RestaurantRepository restaurantRepository,
                             StripeService stripeService,
                             AccountService accountService,
                             StripeAccountRepository stripeAccountRepository,
                             RestaurantEmbeddingRedisService restaurantEmbeddingRedisService,
                             RestaurantRecommendationClient restaurantRecommendationClient) {
        this.restaurantRepository = restaurantRepository;
        this.stripeService = stripeService;
        this.stripeAccountRepository = stripeAccountRepository;
        this.accountService = accountService;
        this.restaurantEmbeddingRedisService = restaurantEmbeddingRedisService;
        this.restaurantRecommendationClient = restaurantRecommendationClient;
    }

    public RestaurantResponseDto createRestaurant(CreateRestaurantRequestDto request, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.ADMIN)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        AccountEntity account = accountService.signUp(request.getSignUpReqDTO(), AccountRole.RESTAURANT);
        CreateRestaurantRequestDto.RestaurantCreateData restaurantCreateData = request.getRestaurantCreateData();
        RestaurantEntity restaurant = new RestaurantEntity();
        restaurant.setName(restaurantCreateData.getName());
        restaurant.setGoogleMapsLink(restaurantCreateData.getGoogleMapsLink());
        restaurant.setLongitude(restaurantCreateData.getLongitude());
        restaurant.setLatitude(restaurantCreateData.getLatitude());
        restaurant.setOwner(account);
        RestaurantEntity savedRestaurant = restaurantRepository.save(restaurant);
        restaurantEmbeddingRedisService.refreshRestaurant(savedRestaurant.getId());
        return toResponseDto(savedRestaurant);
    }

    public PagedResponse<RestaurantResponseDto> getAllRestaurants(Pageable pageable) {
        Page<RestaurantEntity> entities = restaurantRepository.findAll(pageable);
        List<RestaurantResponseDto> dtos = new ArrayList<>();
        for (RestaurantEntity entity : entities.getContent()) {
            dtos.add(toResponseDto(entity));
        }
        return getPagedRes(dtos, entities);
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
        RestaurantEntity updatedRestaurant = restaurantRepository.save(existingRestaurant);
        restaurantEmbeddingRedisService.refreshRestaurant(updatedRestaurant.getId());
        return toResponseDto(updatedRestaurant);
    }

    public void deleteRestaurant(Long id, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT) && !authenticatedUser.role().equals(AccountRole.ADMIN)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        RestaurantEntity existingRestaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + id));
        restaurantRepository.delete(existingRestaurant);
        restaurantEmbeddingRedisService.removeRestaurant(id);
    }

    public PagedResponse<RestaurantResponseDto> getNearbyRestaurants(double lat,
                                                                     double lng,
                                                                     double radiusKm,
                                                                     Pageable pageable) {
        NearbyBounds bounds = calculateNearbyBounds(lat, lng, radiusKm);
        Page<RestaurantEntity> candidates = restaurantRepository.findInBoundingBox(
                bounds.minLat(),
                bounds.maxLat(),
                bounds.minLng(),
                bounds.maxLng(),
                pageable
        );

        List<RestaurantEntity> sorted = candidates.getContent().stream()
                .sorted(Comparator.comparingDouble(restaurant ->
                        distance(lat, lng, restaurant.getLatitude(), restaurant.getLongitude())))
                .toList();

        List<RestaurantResponseDto> dtos = new ArrayList<>();
        for (RestaurantEntity entity : sorted) {
            dtos.add(toResponseDto(entity));
        }
        return getPagedRes(dtos, candidates);
    }

    public List<Long> getNearbyRestaurantIds(double lat, double lng, double radiusKm) {
        return findNearbyRestaurants(lat, lng, radiusKm).stream().map(RestaurantEntity::getId).toList();
    }

    public List<RestaurantResponseDto> recommendNearbyRestaurants(RecommendRestaurantsRequestDto request,
                                                                  Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        List<Long> nearbyRestaurantIds = getNearbyRestaurantIds(request.getLat(), request.getLng(), request.getRadiusKm());
        if (nearbyRestaurantIds.isEmpty()) {
            return List.of();
        }

        List<Long> rankedRestaurantIds = restaurantRecommendationClient.recommendRestaurants(
                authenticatedUser.userId(),
                nearbyRestaurantIds
        );
        if (rankedRestaurantIds.isEmpty()) {
            return List.of();
        }

        Map<Long, RestaurantEntity> restaurantsById = new HashMap<>();
        for (RestaurantEntity restaurant : restaurantRepository.findAllById(rankedRestaurantIds)) {
            restaurantsById.put(restaurant.getId(), restaurant);
        }

        List<RestaurantResponseDto> recommendations = new ArrayList<>();
        for (Long restaurantId : rankedRestaurantIds) {
            RestaurantEntity restaurant = restaurantsById.get(restaurantId);
            if (restaurant != null) {
                recommendations.add(toResponseDto(restaurant));
            }
        }
        return recommendations;
    }

    public PagedResponse<RestaurantResponseDto> getRestaurantsByOwnerId(Authentication authentication, Pageable pageable) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        Page<RestaurantEntity> restaurants = restaurantRepository.findAllByOwner_Id(authenticatedUser.userId(), pageable);
        List<RestaurantResponseDto> dtos = new ArrayList<>();
        for (RestaurantEntity restaurant : restaurants) {
            dtos.add(toResponseDto(restaurant));
        }
        PagedResponse<RestaurantResponseDto> response = new PagedResponse<>();
        response.setData(dtos);
        response.setPage(pageable.getPageNumber());
        response.setSize(pageable.getPageSize());
        response.setTotal(restaurants.getNumberOfElements());
        response.setTotalPages(restaurants.getTotalPages());
        return response;
    }

    public String onboard(Authentication authentication) throws StripeException {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        if (!authenticatedUser.role().equals(AccountRole.RESTAURANT)) {
            throw new AccessDeniedException("You are not allowed to access this resource");
        }
        Long userid = authenticatedUser.userId();
        RestaurantEntity restaurant = restaurantRepository.findByOwner_Id(userid)
                .orElseThrow(() -> new RestaurantNotFoundException("Restaurant with owner id " + userid + " not found"));
        StripeAccountEntity stripeAccountEntity = restaurant.getStripeAccount();
        if (stripeAccountEntity != null && isStripeAccountActive(restaurant.getStripeAccount().getStripeAccountId())) {
            restaurant.getStripeAccount().setActive(true);
            restaurantRepository.save(restaurant);
            return null;
        }
        StripeAccountEntity stripeAccount = new StripeAccountEntity();
        stripeAccount.setStripeAccountId(stripeService.createBusinessAccount(authenticatedUser.email(), restaurant.getId()));
        stripeAccount.setActive(false);
        restaurant.setStripeAccount(stripeAccount);
        restaurantRepository.save(restaurant);
        return createAccountLink(stripeAccount.getStripeAccountId());
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

    private List<RestaurantEntity> findNearbyRestaurants(double lat, double lng, double radiusKm) {
        NearbyBounds bounds = calculateNearbyBounds(lat, lng, radiusKm);

        return restaurantRepository.findInBoundingBox(bounds.minLat(), bounds.maxLat(), bounds.minLng(), bounds.maxLng()).stream()
                .filter(restaurant -> distance(lat, lng, restaurant.getLatitude(), restaurant.getLongitude()) <= radiusKm)
                .sorted(Comparator.comparingDouble(restaurant ->
                        distance(lat, lng, restaurant.getLatitude(), restaurant.getLongitude())))
                .toList();
    }

    private NearbyBounds calculateNearbyBounds(double lat, double lng, double radiusKm) {
        double latRange = radiusKm / 111.0;
        double lngRange = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));

        return new NearbyBounds(
                lat - latRange,
                lat + latRange,
                lng - lngRange,
                lng + lngRange
        );
    }

    private double distance(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) *
                        Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private PagedResponse<RestaurantResponseDto> getPagedRes(List<RestaurantResponseDto> dtos, Page<RestaurantEntity> entities) {
        PagedResponse<RestaurantResponseDto> response = new PagedResponse<>();
        response.setData(dtos);
        response.setPage(entities.getNumber());
        response.setSize(entities.getSize());
        response.setTotal(entities.getNumberOfElements());
        response.setTotalPages(entities.getTotalPages());
        return response;
    }

    private String createAccountLink(String accountId) throws StripeException {
        AccountLinkCreateParams params = AccountLinkCreateParams.builder()
                .setAccount(accountId)
                .setRefreshUrl("http://localhost:3000/settings?stripe=refresh")
                .setReturnUrl("http://localhost:3000/restaurant/food-sales?stripe=return")
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build();
        AccountLink accountLink = AccountLink.create(params);
        return accountLink.getUrl();
    }

    private boolean isStripeAccountActive(String stripeAccountId) throws StripeException {
        Account account = Account.retrieve(stripeAccountId);
        return account.getChargesEnabled() && account.getPayoutsEnabled() && account.getDetailsSubmitted();
    }

    private record NearbyBounds(double minLat, double maxLat, double minLng, double maxLng) {
    }
}
