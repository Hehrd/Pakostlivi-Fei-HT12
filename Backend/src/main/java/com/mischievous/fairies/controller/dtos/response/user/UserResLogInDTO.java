package com.mischievous.fairies.controller.dtos.response.user;

import com.mischievous.fairies.auth.filter.AuthTokens;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class UserResLogInDTO {

    @NotBlank
    private AuthTokens authTokens;
    @NotBlank
    private String username;
}
