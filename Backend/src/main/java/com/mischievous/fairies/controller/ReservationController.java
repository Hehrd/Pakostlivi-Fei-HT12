package com.mischievous.fairies.controller;

import com.mischievous.fairies.common.exceptions.ReservationNotFoundException;
import com.mischievous.fairies.controller.dtos.request.reservation.SaveReservationReqDTO;
import com.mischievous.fairies.controller.dtos.response.reservation.GetReservationDTO;
import com.mischievous.fairies.service.JwtService;
import com.mischievous.fairies.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reservations")
public class ReservationController {
    private final ReservationService reservationService;
    private final JwtService jwtService;

    @Autowired
    public ReservationController(ReservationService reservationService,  JwtService jwtService) {
        this.reservationService = reservationService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<Long> createReservation(@RequestBody SaveReservationReqDTO saveReservationReqDTO, @CookieValue(name = "access_token", required = false) String accessToken) {
        Long foodSaleId = reservationService.saveReservation(saveReservationReqDTO.getFoodSaleId(),
                                                             jwtService.extractUserIdFromRefreshToken(accessToken));

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(foodSaleId);
    }

    @GetMapping("/{reservationId}")
    public ResponseEntity<GetReservationDTO> getReservation(@PathVariable Long reservationId,
                                                            @CookieValue(name = "access_token",  required = false) String accessToken) {
        Long clientId = jwtService.extractUserIdFromRefreshToken(accessToken);
        GetReservationDTO getReservationDTO = reservationService.getReservation(reservationId, clientId);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(getReservationDTO);
    }
}
