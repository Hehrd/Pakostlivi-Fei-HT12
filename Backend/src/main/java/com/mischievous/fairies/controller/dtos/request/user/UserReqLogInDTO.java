package com.mischievous.fairies.controller.dtos.request.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserReqLogInDTO {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
