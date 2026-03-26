package com.mischievous.fairies.persistence.model;

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

    @Column(nullable = false)
    private Instant issued_at;

    @Column(nullable = false)
    private Instant expires_at;

    @ManyToOne
    @JoinColumn(name = "food_sale_id", nullable = false)
    private FoodSaleEntity foodSaleEntity;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity clientEntity;
}
