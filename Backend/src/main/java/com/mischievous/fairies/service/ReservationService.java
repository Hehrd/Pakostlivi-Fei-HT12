package com.mischievous.fairies.service;

import com.mischievous.fairies.common.exceptions.FoodSaleDoesNotExist;
import com.mischievous.fairies.common.exceptions.ReservationNotFoundException;
import com.mischievous.fairies.common.exceptions.UserNotExistingException;
import com.mischievous.fairies.controller.dtos.response.reservation.GetReservationDTO;
import com.mischievous.fairies.persistence.model.ClientEntity;
import com.mischievous.fairies.persistence.model.FoodSaleEntity;
import com.mischievous.fairies.persistence.model.ReservationEntity;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.repository.ClientRepository;
import com.mischievous.fairies.persistence.repository.FoodSaleRepository;
import com.mischievous.fairies.persistence.repository.ReservationRepository;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final FoodSaleRepository foodSaleRepository;
    private final ClientRepository clientRepository;

    @Autowired
    public ReservationService(
            ReservationRepository reservationRepository,
            FoodSaleRepository foodSaleRepository,
            ClientRepository clientRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.foodSaleRepository = foodSaleRepository;
        this.clientRepository = clientRepository;
    }

    public Long saveReservation(Long foodSaleId, Long clientId) {
        FoodSaleEntity foodSaleEntity = foodSaleRepository.findById(foodSaleId)
                .orElseThrow(() -> new FoodSaleDoesNotExist("Food sale not found"));

        ClientEntity clientEntity = clientRepository.findByClientId(clientId)
                .orElseThrow(() -> new UserNotExistingException("User not found"));

        Instant issuedAt = Instant.now();

        ReservationEntity reservation = new ReservationEntity();
        reservation.setFoodSaleEntity(foodSaleEntity);
        reservation.setClientEntity(clientEntity);
        reservation.setIssued_at(issuedAt);
        reservation.setExpires_at(issuedAt.plus(1, ChronoUnit.HOURS));

        reservationRepository.save(reservation);

        return reservation.getId();
    }

    public GetReservationDTO getReservation(Long reservationId, Long clientId) {
        ReservationEntity reservationEntity = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found"));

        if (!reservationEntity.getClientEntity().getId().equals(clientId)) {
            throw new ReservationNotFoundException("Reservation not found");
        }

        GetReservationDTO getReservationDTO = new GetReservationDTO();
        getReservationDTO.setReservationId(reservationEntity.getId());
        getReservationDTO.setIssued_at(reservationEntity.getIssued_at());
        getReservationDTO.setExpires_at(reservationEntity.getExpires_at());

        return getReservationDTO;
    }
}
