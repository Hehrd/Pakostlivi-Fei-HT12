package com.mischievous.fairies.controller.dtos.response.user;

import com.mischievous.fairies.controller.dtos.response.tag.AllergenResponseDTO;
import com.mischievous.fairies.controller.dtos.response.tag.FoodTagResponseDTO;
import lombok.Data;

import java.util.List;

@Data
public class UserProfileResDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String profilePictureUrl;
    private List<AllergenResponseDTO> allergenTypes;
    private List<FoodTagResponseDTO> foodTagTypes;
}
