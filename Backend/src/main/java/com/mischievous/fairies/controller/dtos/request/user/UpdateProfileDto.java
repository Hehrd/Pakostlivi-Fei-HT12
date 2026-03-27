package com.mischievous.fairies.controller.dtos.request.user;

import com.mischievous.fairies.controller.dtos.response.tag.AllergenResponseDTO;
import com.mischievous.fairies.controller.dtos.response.tag.FoodTagResponseDTO;
import com.mischievous.fairies.persistence.status.AllergenType;
import com.mischievous.fairies.persistence.status.FoodTagType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateProfileDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String profilePictureUrl;
    private List<FoodTagResponseDTO> foodTagTypes;
    private List<AllergenResponseDTO> allergenTypes;
}
