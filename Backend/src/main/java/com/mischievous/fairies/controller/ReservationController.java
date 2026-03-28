package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.reservation.SaveReservationReqDTO;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.reservation.GetReservationDTO;
import com.mischievous.fairies.service.JwtService;
import com.mischievous.fairies.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
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
    public ReservationController(ReservationService reservationService, JwtService jwtService) {
        this.reservationService = reservationService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public ResponseEntity<Long> createReservation(@RequestBody SaveReservationReqDTO saveReservationReqDTO,
                                                  Authentication authentication) {
        Long reservationId = reservationService.saveReservation(saveReservationReqDTO, authentication);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reservationId);
    }

    @GetMapping("/{reservationId}")
    public ResponseEntity<GetReservationDTO> getReservation(@PathVariable(name = "reservationId") Long reservationId,
                                                            Authentication authentication) {
        GetReservationDTO getReservationDTO = reservationService.getReservation(reservationId, authentication);

        return ResponseEntity.ok(getReservationDTO);
    }

    @GetMapping("/by-user")
    public ResponseEntity<PagedResponse<GetReservationDTO>> getReservations(Authentication authentication, Pageable pageable) {
        PagedResponse<GetReservationDTO> pagedResponse = reservationService.getReservationsByUser(authentication, pageable);
        return ResponseEntity.ok(pagedResponse);
    }

    @GetMapping("/by-restaurant/{restaurantId}")
    public ResponseEntity<PagedResponse<GetReservationDTO>> getReservationsByRestaurant(Pageable pageable, @PathVariable(name = "restaurantId") Long restaurantId) {
        PagedResponse<GetReservationDTO> pagedResponse = reservationService.getReservationsByRestaurant(restaurantId, pageable);
        return ResponseEntity.ok(pagedResponse);
    }

    @GetMapping("/by-food-sale/{foodSaleId}")
    public ResponseEntity<PagedResponse<GetReservationDTO>> getReservationsByFoodSales(Pageable pageable, @PathVariable(name = "foodSaleId") Long foodSaleId) {
        PagedResponse<GetReservationDTO> pagedResponse = reservationService.getReservationsByFoodSale(foodSaleId, pageable);
        return ResponseEntity.ok(pagedResponse);
    }

}
