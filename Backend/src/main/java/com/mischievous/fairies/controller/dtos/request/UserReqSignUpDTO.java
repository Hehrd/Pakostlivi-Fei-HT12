package com.mischievous.fairies.controller.dtos.request;

import com.mischievous.fairies.persistence.status.AccountRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserReqSignUpDTO {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters long")
    private String password;

    @NotBlank
    private AccountRole role;
}
