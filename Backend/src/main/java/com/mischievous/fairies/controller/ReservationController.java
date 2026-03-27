package com.mischievous.fairies.controller;

import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.controller.dtos.request.reservation.SaveReservationReqDTO;
import com.mischievous.fairies.controller.dtos.response.reservation.GetReservationDTO;
import com.mischievous.fairies.service.JwtService;
import com.mischievous.fairies.service.ReservationService;
import com.mischievous.fairies.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    public ResponseEntity<Long> createReservation(@RequestBody SaveReservationReqDTO saveReservationReqDTO,
                                                  Authentication authentication) {
        Long foodSaleId = reservationService.saveReservation(saveReservationReqDTO.getFoodSaleId(), authentication);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(foodSaleId);
    }

    @GetMapping("/{reservationId}")
    public ResponseEntity<GetReservationDTO> getReservation(@PathVariable Long reservationId) {
        Long clientId = SecurityUtils.getCurrentUserId();
        GetReservationDTO getReservationDTO = reservationService.getReservation(reservationId, clientId);

        return ResponseEntity.ok(getReservationDTO);
    }
}
