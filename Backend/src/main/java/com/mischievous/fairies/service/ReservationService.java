package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.common.exceptions.FoodSaleDoesNotExist;
import com.mischievous.fairies.common.exceptions.ReservationNotFoundException;
import com.mischievous.fairies.common.exceptions.UserNotExistingException;
import com.mischievous.fairies.controller.dtos.response.reservation.GetReservationDTO;
import com.mischievous.fairies.persistence.model.AccountEntity;
import com.mischievous.fairies.persistence.model.FoodSaleEntity;
import com.mischievous.fairies.persistence.model.ReservationEntity;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.repository.AccountRepository;
import com.mischievous.fairies.persistence.repository.FoodSaleRepository;
import com.mischievous.fairies.persistence.repository.ReservationRepository;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import com.mischievous.fairies.persistence.status.AccountRole;
import com.mischievous.fairies.persistence.status.ReservationStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final FoodSaleRepository foodSaleRepository;
    private final AccountRepository accountRepository;

    @Autowired
    public ReservationService(
            ReservationRepository reservationRepository,
            FoodSaleRepository foodSaleRepository,
            AccountRepository accountRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.foodSaleRepository = foodSaleRepository;
        this.accountRepository = accountRepository;
    }

    public Long saveReservation(Long foodSaleId, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();

        FoodSaleEntity foodSaleEntity = foodSaleRepository.findById(foodSaleId)
                .orElseThrow(() -> new FoodSaleDoesNotExist("Food sale not found"));

        AccountEntity accountEntity = accountRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new UserNotExistingException("User not found"));

        Instant issuedAt = Instant.now();

        ReservationEntity reservation = new ReservationEntity();
        reservation.setFoodSaleEntity(foodSaleEntity);
        reservation.setAccount(accountEntity);
        reservation.setIssuedAt(issuedAt);
        reservation.setExpiresAt(issuedAt.plus(1, ChronoUnit.HOURS));
        reservation.setStatus(ReservationStatus.UNPAID);
        reservationRepository.save(reservation);

        return reservation.getId();
    }

    public GetReservationDTO getReservation(Long reservationId, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        ReservationEntity reservationEntity = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found"));

        if (!reservationEntity.getAccount().getId().equals(authenticatedUser.userId())) {
            throw new ReservationNotFoundException("Reservation not found");
        }

        GetReservationDTO getReservationDTO = new GetReservationDTO();
        getReservationDTO.setReservationId(reservationEntity.getId());
        getReservationDTO.setIssued_at(reservationEntity.getIssuedAt());
        getReservationDTO.setExpires_at(reservationEntity.getExpiresAt());

        return getReservationDTO;
    }

    public void deleteReservation(Long id) {
        reservationRepository.deleteById(id);
    }
}
