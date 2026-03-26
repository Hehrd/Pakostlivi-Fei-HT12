package com.mischievous.fairies.controller.dtos.request.reservation;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SaveReservationReqDTO {
    @NotNull
    private Long foodSaleId;
}
