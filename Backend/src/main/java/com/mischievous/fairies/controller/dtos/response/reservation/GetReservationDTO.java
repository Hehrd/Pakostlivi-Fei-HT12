package com.mischievous.fairies.controller.dtos.response.reservation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetReservationDTO {
    private long reservationId;
    private int quantity;
    private String accessCode;
    private Instant issued_at;
    private Instant expires_at;
}
