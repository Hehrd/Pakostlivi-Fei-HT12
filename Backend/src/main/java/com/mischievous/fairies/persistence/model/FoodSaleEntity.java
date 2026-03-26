package com.mischievous.fairies.persistence.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Date;

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
    private Long price;

    @Column
    private Date issuedAt;

    @Column
    private Date expiresAt;
}