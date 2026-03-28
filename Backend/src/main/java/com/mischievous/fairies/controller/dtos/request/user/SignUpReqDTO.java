package com.mischievous.fairies.controller.dtos.request.user;

import com.mischievous.fairies.controller.dtos.response.tag.AllergenResponseDTO;
import com.mischievous.fairies.controller.dtos.response.tag.FoodTagResponseDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class SignUpReqDTO {

    @Valid
    @NotBlank(message = "Email is required")
    private String email;

    @Valid
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters long")
    private String password;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank
    private String profilePictureUrl;

    @NotNull
    private List<AllergenResponseDTO> allergens;

    @NotNull
    private List<FoodTagResponseDTO> foodTags;

}
