package com.mischievous.fairies.persistence.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "restaurants")
@Data
public class RestaurantEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "google_maps_link", length = 500)
    private String googleMapsLink;

    @Column
    private double longitude;

    @Column
    private double latitude;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, mappedBy = "restaurant")
    private List<FoodEntity> foods = new ArrayList<>();

    @ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private AccountEntity owner;

    @JoinColumn(name = "stripe_account_id")
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private StripeAccountEntity stripeAccount;
}
