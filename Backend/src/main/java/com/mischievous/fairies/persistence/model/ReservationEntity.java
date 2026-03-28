package com.mischievous.fairies.persistence.model;

import com.mischievous.fairies.persistence.status.ReservationStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
@Table(name = "reservations")
public class ReservationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private int accessCode;

    @Column
    private int quantity;

    @Column(nullable = false)
    private Instant issuedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @ManyToOne
    @JoinColumn(name = "food_sale_id", nullable = false)
    private FoodSaleEntity foodSaleEntity;

    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private AccountEntity account;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReservationStatus status;

    @Column
    private String paymentIntentId;
}
