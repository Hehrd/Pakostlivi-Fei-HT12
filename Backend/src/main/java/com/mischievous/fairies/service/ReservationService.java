package com.mischievous.fairies.service;

import com.mischievous.fairies.common.exceptions.ReservationNotFoundException;
import com.mischievous.fairies.controller.dtos.response.reservation.GetReservationDTO;
import com.mischievous.fairies.persistence.model.ReservationEntity;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.repository.ReservationRepository;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final RestaurantRepository restaurantRepository;

    @Autowired
    public ReservationService(
            ReservationRepository reservationRepository,
            RestaurantRepository restaurantRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public Long saveReservation(Long restaurantId) {
        RestaurantEntity restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found with id: " + restaurantId));

        Instant issuedAt = Instant.now();

        ReservationEntity reservation = new ReservationEntity();
        reservation.setRestaurantEntity(restaurant);
        reservation.setIssued_at(issuedAt);
        reservation.setExpires_at(issuedAt.plus(1, ChronoUnit.HOURS));

        reservationRepository.save(reservation);

        return reservation.getId();
    }

    public GetReservationDTO getReservation(Long reservationId) {
        ReservationEntity reservationEntity = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found"));

        GetReservationDTO getReservationDTO = new GetReservationDTO();
        getReservationDTO.setReservationId(reservationEntity.getId());
        getReservationDTO.setIssued_at(reservationEntity.getIssued_at());
        getReservationDTO.setExpires_at(reservationEntity.getExpires_at());

        return getReservationDTO;
    }
}
