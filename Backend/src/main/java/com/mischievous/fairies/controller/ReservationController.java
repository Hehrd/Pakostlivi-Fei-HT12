package com.mischievous.fairies.controller;

import com.mischievous.fairies.common.exceptions.ReservationNotFoundException;
import com.mischievous.fairies.controller.dtos.response.reservation.GetReservationDTO;
import com.mischievous.fairies.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reservations")
public class ReservationController {
    private final ReservationService reservationService;

    @Autowired
    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<Long> createReservation(@RequestBody Long restaurantId) {
        Long reservationId = reservationService.saveReservation(restaurantId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reservationId);
    }

    @GetMapping("/{reservationId}")
    public ResponseEntity<GetReservationDTO> getReservation(@PathVariable Long reservationId) throws ReservationNotFoundException {
        GetReservationDTO getReservationDTO = reservationService.getReservation(reservationId);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(getReservationDTO);
    }
}
