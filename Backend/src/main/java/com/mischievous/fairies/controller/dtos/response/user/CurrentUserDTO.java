package com.mischievous.fairies.controller.dtos.response.user;

import com.mischievous.fairies.persistence.status.AccountRole;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CurrentUserDTO {
    private Long id;
    private String email;
    private AccountRole role;
}
