package com.mischievous.fairies.controller.dtos.response.user;

import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.persistence.status.AccountRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResLogInDTO {
    @NotNull
    private Long id;
    @NotBlank
    private String email;
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    @NotNull
    private AccountRole role;
}
