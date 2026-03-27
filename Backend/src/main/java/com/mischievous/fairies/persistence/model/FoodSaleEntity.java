package com.mischievous.fairies.persistence.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;
import java.time.Instant;

@Entity
@Table(name = "food_sales")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FoodSaleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn(name = "food_id", nullable = false)
    @OneToOne(cascade = CascadeType.ALL)
    private FoodEntity food;

    @Column
    private double price;

    @Column
    private int quantity;

    @Column
    private Instant issuedAt;

    @Column
    private Instant expiresAt;
}