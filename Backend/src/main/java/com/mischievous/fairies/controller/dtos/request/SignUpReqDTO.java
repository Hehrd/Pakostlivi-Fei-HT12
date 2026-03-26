package com.mischievous.fairies.controller.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SignUpReqDTO {

    @Valid
    @NotNull
    private UserReqSignUpDTO user;

    @Valid
    @NotNull
    private ClientReqDTO client;
}
