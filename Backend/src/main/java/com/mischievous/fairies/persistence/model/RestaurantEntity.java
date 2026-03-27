package com.mischievous.fairies.persistence.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table
@Data
public class RestaurantEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private AccountEntity account;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "google_maps_link", length = 500)
    private String googleMapsLink;

    @Column
    private double longitude;

    @Column
    private double latitude;

    @ManyToMany
    @JoinTable(
            name = "restaurant_foods",
            joinColumns = @JoinColumn(name = "restaurant_id"),
            inverseJoinColumns = @JoinColumn(name = "food_id")
    )
    private List<FoodEntity> foods = new ArrayList<>();
}
