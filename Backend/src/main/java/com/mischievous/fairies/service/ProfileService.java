package com.mischievous.fairies.service;

import com.mischievous.fairies.controller.dtos.response.tag.AllergenResponseDTO;
import com.mischievous.fairies.controller.dtos.response.tag.FoodTagResponseDTO;
import com.mischievous.fairies.controller.dtos.response.user.UserProfileResDto;
import com.mischievous.fairies.persistence.model.ProfileEntity;
import com.mischievous.fairies.persistence.repository.AccountRepository;
import com.mischievous.fairies.persistence.repository.ProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {
    private final AccountRepository accountRepository;
    private final ProfileRepository profileRepository;

    public ProfileService(AccountRepository accountRepository, ProfileRepository profileRepository) {
        this.accountRepository = accountRepository;
        this.profileRepository = profileRepository;
    }


    public UserProfileResDto getUserProfileByAccountId(Long accountId) {
        ProfileEntity profileEntity = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + accountId)).getProfile();
        List<AllergenResponseDTO> allergens = profileEntity.getAccount().getAllergens().stream()
                .map(allergen -> new AllergenResponseDTO(allergen.getId(), allergen.getType()))
                .toList();
        List<FoodTagResponseDTO> foodTags = profileEntity.getAccount().getFoodTags().stream()
                .map(foodTag -> new FoodTagResponseDTO(foodTag.getId(), foodTag.getType())).toList();
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
