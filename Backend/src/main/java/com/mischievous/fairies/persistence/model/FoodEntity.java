package com.mischievous.fairies.persistence.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Entity
@Table(name = "foods")
@AllArgsConstructor
@NoArgsConstructor
public class FoodEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 150)
    private String description;


    @ManyToMany
    @JoinTable(
            name = "food_allergens",
            joinColumns = @JoinColumn(name = "food_id"),
            inverseJoinColumns = @JoinColumn(name = "allergen_id")
    )
    private List<AllergenEntity> allergens = new ArrayList();

    @ManyToMany
    @JoinTable(
            name = "food_food_tags",
            joinColumns = @JoinColumn(name = "food_id"),
            inverseJoinColumns = @JoinColumn(name = "food_tag_id")
    )
    private List<FoodTagEntity> foodTags = new ArrayList();

    @JoinColumn(name = "restaurant_id", nullable = false)
    @ManyToOne
    private RestaurantEntity restaurant;
}
