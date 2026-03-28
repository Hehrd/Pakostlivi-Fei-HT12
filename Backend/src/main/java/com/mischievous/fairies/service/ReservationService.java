package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.common.exceptions.FoodSaleDoesNotExist;
import com.mischievous.fairies.common.exceptions.ReservationNotFoundException;
import com.mischievous.fairies.common.exceptions.UserNotExistingException;
import com.mischievous.fairies.controller.dtos.request.reservation.SaveReservationReqDTO;
import com.mischievous.fairies.controller.dtos.response.PagedResponse;
import com.mischievous.fairies.controller.dtos.response.reservation.GetReservationDTO;
import com.mischievous.fairies.persistence.model.AccountEntity;
import com.mischievous.fairies.persistence.model.FoodSaleEntity;
import com.mischievous.fairies.persistence.model.ReservationEntity;
import com.mischievous.fairies.persistence.repository.AccountRepository;
import com.mischievous.fairies.persistence.repository.FoodSaleRepository;
import com.mischievous.fairies.persistence.repository.ReservationRepository;
import com.mischievous.fairies.persistence.status.ReservationStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

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

    public Long saveReservation(SaveReservationReqDTO dto, Authentication authentication) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        FoodSaleEntity foodSaleEntity = foodSaleRepository.findById(dto.getFoodSaleId())
                .orElseThrow(() -> new FoodSaleDoesNotExist("Food sale not found"));

        if (foodSaleEntity.getQuantity() < dto.getQuantity()) {
            throw new IllegalArgumentException("Not enough quantity available");
        }

        foodSaleEntity.setQuantity(foodSaleEntity.getQuantity() - dto.getQuantity());
        foodSaleRepository.save(foodSaleEntity);

        AccountEntity accountEntity = accountRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new UserNotExistingException("User not found"));

        if (dto.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        Instant issuedAt = Instant.now();

        ReservationEntity reservation = new ReservationEntity();
        reservation.setFoodSaleEntity(foodSaleEntity);
        reservation.setAccount(accountEntity);
        reservation.setQuantity(dto.getQuantity());
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

    public PagedResponse<GetReservationDTO> getReservationsByUser(Authentication authentication, Pageable pageable) {
        AuthenticatedUser authenticatedUser = (AuthenticatedUser) authentication.getPrincipal();
        Page<ReservationEntity> reservationEntities = reservationRepository
                .findByAccount_Id(authenticatedUser.userId(), pageable);
        PagedResponse<GetReservationDTO> pagedResponse = new PagedResponse<>();
        List<GetReservationDTO> getReservationDTOList = new ArrayList<>();
        for (ReservationEntity reservationEntity : reservationEntities.getContent()) {
            getReservationDTOList.add(toGetReservationDTO(reservationEntity));
        }
        pagedResponse.setData(getReservationDTOList);
        pagedResponse.setPage(pageable.getPageNumber());
        pagedResponse.setSize(pageable.getPageSize());
        pagedResponse.setTotal(reservationEntities.getTotalElements());
        pagedResponse.setTotalPages(reservationEntities.getTotalPages());
        return pagedResponse;
    }

    public PagedResponse<GetReservationDTO> getReservationsByFoodSale(Long foodSaleId, Pageable pageable) {
        Page<ReservationEntity> reservationEntities = reservationRepository
                .findByFoodSaleEntity_Id(foodSaleId, pageable);
        PagedResponse<GetReservationDTO> pagedResponse = new PagedResponse<>();
        List<GetReservationDTO> list = new ArrayList<>();
        for (ReservationEntity reservationEntity : reservationEntities.getContent()) {
            list.add(toGetReservationDTO(reservationEntity));
        }
        pagedResponse.setData(list);
        pagedResponse.setPage(pageable.getPageNumber());
        pagedResponse.setSize(pageable.getPageSize());
        pagedResponse.setTotal(reservationEntities.getTotalElements());
        pagedResponse.setTotalPages(reservationEntities.getTotalPages());
        return pagedResponse;
    }

    public PagedResponse<GetReservationDTO> getReservationsByRestaurant(Long restaurantId, Pageable pageable) {
        Page<ReservationEntity> reservationEntities = reservationRepository
                .findByFoodSaleEntity_Food_Restaurant_Id(restaurantId, pageable);
        PagedResponse<GetReservationDTO> pagedResponse = new PagedResponse<>();
        List<GetReservationDTO> list = new ArrayList<>();
        for (ReservationEntity reservationEntity : reservationEntities.getContent()) {
            list.add(toGetReservationDTO(reservationEntity));
        }
        pagedResponse.setData(list);
        pagedResponse.setPage(pageable.getPageNumber());
        pagedResponse.setSize(pageable.getPageSize());
        pagedResponse.setTotal(reservationEntities.getTotalElements());
        pagedResponse.setTotalPages(reservationEntities.getTotalPages());
        return pagedResponse;
    }


    private GetReservationDTO toGetReservationDTO(ReservationEntity reservationEntity) {
        GetReservationDTO getReservationDTO = new GetReservationDTO();
        getReservationDTO.setReservationId(reservationEntity.getId());
        getReservationDTO.setIssued_at(reservationEntity.getIssuedAt());
        getReservationDTO.setExpires_at(reservationEntity.getExpiresAt());
        getReservationDTO.setQuantity(reservationEntity.getQuantity());
        getReservationDTO.setAccessCode(reservationEntity.getAccessCode());
        return getReservationDTO;
    }
}
