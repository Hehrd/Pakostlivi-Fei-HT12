package com.mischievous.fairies.service;

import com.mischievous.fairies.controller.dtos.request.user.UpdateProfileDto;
import com.mischievous.fairies.controller.dtos.response.tag.AllergenResponseDTO;
import com.mischievous.fairies.controller.dtos.response.tag.FoodTagResponseDTO;
import com.mischievous.fairies.controller.dtos.response.user.UserProfileResDto;
import com.mischievous.fairies.persistence.model.AllergenEntity;
import com.mischievous.fairies.persistence.model.FoodTagEntity;
import com.mischievous.fairies.persistence.model.ProfileEntity;
import com.mischievous.fairies.persistence.repository.AllergenRepository;
import com.mischievous.fairies.persistence.repository.FoodTagRepository;
import com.mischievous.fairies.persistence.repository.ProfileRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProfileService {
    private final AllergenRepository allergenRepository;
    private final FoodTagRepository foodTagRepository;
    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository,
                          AllergenRepository allergenRepository,
                          FoodTagRepository foodTagRepository) {
        this.profileRepository = profileRepository;
        this.allergenRepository = allergenRepository;
        this.foodTagRepository = foodTagRepository;
    }


    public UserProfileResDto getUserProfileByAccountId(Long accountId) {
        ProfileEntity profileEntity = profileRepository.findByAccount_Id(accountId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + accountId));
        List<AllergenResponseDTO> allergens = profileEntity.getAllergens().stream()
                .map(allergen -> new AllergenResponseDTO(allergen.getId(), allergen.getType()))
                .toList();
        List<FoodTagResponseDTO> foodTags = profileEntity.getFoodTags().stream()
                .map(foodTag -> new FoodTagResponseDTO(foodTag.getId(), foodTag.getType())).toList();
        final UserProfileResDto resDto = toDto(profileEntity, allergens, foodTags);
        return resDto;
    }


    public UserProfileResDto updateUserProfile(UpdateProfileDto updateProfileDto) {
            ProfileEntity profileEntity = profileRepository.findById(updateProfileDto.getId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + updateProfileDto.getId()));
            profileEntity.setFirstname(updateProfileDto.getFirstName());
            profileEntity.setLastname(updateProfileDto.getLastName());
            profileEntity.setProfilePictureUrl(updateProfileDto.getProfilePictureUrl());
            profileEntity.setAllergens(getAllergenEntities(updateProfileDto.getAllergenTypes()));
            profileEntity.setFoodTags(getFoodTagEntities(updateProfileDto.getFoodTagTypes()));
            return toDto(profileRepository.save(profileEntity), updateProfileDto.getAllergenTypes(), updateProfileDto.getFoodTagTypes());
    }

    private List<AllergenEntity> getAllergenEntities(List<AllergenResponseDTO> allergens) {
        List<AllergenEntity> allergenEntities = new ArrayList<>();
        for (AllergenResponseDTO allergen : allergens) {
            AllergenEntity allergenEntity = allergenRepository.findById(allergen.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Allergen not found with id: " + allergen.getId()));
            allergenEntities.add(allergenEntity);
        }
        return allergenEntities;
    }

    private List<FoodTagEntity> getFoodTagEntities(List<FoodTagResponseDTO> foodTags) {
        List<FoodTagEntity> foodTagEntities = new ArrayList<>();
        for (FoodTagResponseDTO foodTag : foodTags) {
            FoodTagEntity foodTagEntity = foodTagRepository.findById(foodTag.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Allergen not found with id: " + foodTag.getId()));
            foodTagEntities.add(foodTagEntity);
        }
        return foodTagEntities;
    }

    private UserProfileResDto toDto(ProfileEntity profileEntity, List<AllergenResponseDTO> allergens, List<FoodTagResponseDTO> foodTags) {
        UserProfileResDto resDto = new UserProfileResDto();
        resDto.setId(profileEntity.getId());
        resDto.setFirstName(profileEntity.getFirstname());
        resDto.setLastName(profileEntity.getLastname());
        resDto.setProfilePictureUrl(profileEntity.getProfilePictureUrl());
        resDto.setAllergenTypes(allergens);
        resDto.setFoodTagTypes(foodTags);
        return resDto;
    }
}
