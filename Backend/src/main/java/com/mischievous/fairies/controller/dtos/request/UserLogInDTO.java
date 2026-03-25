package com.mischievous.fairies.controller.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLogInDTO {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
