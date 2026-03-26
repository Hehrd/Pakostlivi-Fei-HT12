package com.mischievous.fairies.controller.dtos.request.user;

import com.mischievous.fairies.persistence.status.AccountRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignUpReqDTO {

    @Valid
    @NotNull
    private UserReqSignUpDTO user;

    @Valid
    @NotNull
    private ClientReqDTO client;

    @Data
    public static class UserReqSignUpDTO {

        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters long")
        private String password;

        @NotNull
        private AccountRole role;
    }
}
