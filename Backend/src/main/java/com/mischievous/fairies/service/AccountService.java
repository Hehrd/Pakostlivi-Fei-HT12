package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.common.exceptions.EmailAlreadyInUseException;
import com.mischievous.fairies.common.exceptions.WrongCredentialsException;
import com.mischievous.fairies.controller.dtos.request.user.SignUpReqDTO;
import com.mischievous.fairies.controller.dtos.request.user.UserReqLogInDTO;
import com.mischievous.fairies.controller.dtos.response.tag.AllergenResponseDTO;
import com.mischievous.fairies.controller.dtos.response.tag.FoodTagResponseDTO;
import com.mischievous.fairies.controller.dtos.response.user.UserProfileResDto;
import com.mischievous.fairies.controller.dtos.response.user.UserResLogInDTO;
import com.mischievous.fairies.persistence.model.AccountEntity;
import com.mischievous.fairies.persistence.model.AllergenEntity;
import com.mischievous.fairies.persistence.model.FoodTagEntity;
import com.mischievous.fairies.persistence.model.ProfileEntity;
import com.mischievous.fairies.persistence.repository.AccountRepository;
import com.mischievous.fairies.persistence.repository.AllergenRepository;
import com.mischievous.fairies.persistence.repository.FoodTagRepository;
import com.mischievous.fairies.persistence.status.AccountRole;
import lombok.Data;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AccountService {


    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AllergenRepository allergenRepository;
    private final FoodTagRepository foodTagRepository;

    public AccountService(
            AccountRepository accountRepository,
            JwtService jwtService,
            BCryptPasswordEncoder passwordEncoder,
            AllergenRepository allergenRepository,
            FoodTagRepository foodTagRepository
    ) {
        this.accountRepository = accountRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.allergenRepository = allergenRepository;
        this.foodTagRepository = foodTagRepository;
    }

    public AccountEntity signUp(SignUpReqDTO signUpReqDTO, AccountRole role) throws EmailAlreadyInUseException {
        if (accountRepository.existsByEmail(signUpReqDTO.getEmail())) {
            throw new EmailAlreadyInUseException("Email is already in use");
        }

        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setEmail(signUpReqDTO.getEmail());
        accountEntity.setPasswordHash(passwordEncoder.encode(signUpReqDTO.getPassword()));

        ProfileEntity profileEntity = new ProfileEntity();
        profileEntity.setFirstname(signUpReqDTO.getFirstName());
        profileEntity.setLastname(signUpReqDTO.getLastName());
        profileEntity.setProfilePictureUrl(signUpReqDTO.getProfilePictureUrl());
        profileEntity.setAllergens(getAllergenEntities(signUpReqDTO.getAllergens()));
        profileEntity.setFoodTags(getFoodTagEntities(signUpReqDTO.getFoodTags()));


        accountEntity.setProfile(profileEntity);
        profileEntity.setAccount(accountEntity);
        accountEntity.setRole(role);

        return accountRepository.save(accountEntity);

    }

    public LoginAuth logIn(UserReqLogInDTO dto) throws WrongCredentialsException {
        AccountEntity user = accountRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new WrongCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new WrongCredentialsException("Invalid credentials");
        }

        jwtService.revokeAllUserTokens(user);

        String accessToken = jwtService.generateAccessToken(user.getId(),
                                                            user.getEmail(),
                                                            user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        jwtService.saveRefreshToken(refreshToken, user);


        UserResLogInDTO resDto = new UserResLogInDTO();
        resDto.setId(user.getId());
        resDto.setEmail(user.getEmail());
        resDto.setFirstName(user.getProfile().getFirstname());
        resDto.setLastName(user.getProfile().getLastname());
        resDto.setRole(user.getRole());
        LoginAuth auth = new LoginAuth();
        auth.setResDto(resDto);
        auth.setTokens(new AuthTokens(accessToken, refreshToken));
        return auth;
    }

    public void logOut(String refreshToken) {
        jwtService.revokeRefreshToken(refreshToken);
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
                    .orElseThrow(() -> new IllegalArgumentException("FoodTag not found with id: " + foodTag.getId()));
            foodTagEntities.add(foodTagEntity);
        }
        return foodTagEntities;
    }

    @Data
    public class LoginAuth {
        private UserResLogInDTO resDto;
        private AuthTokens tokens;
    }
}
