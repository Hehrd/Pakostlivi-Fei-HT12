package com.mischievous.fairies.controller.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CurrentUserDTO {
    private Integer id;
    private String email;
}
