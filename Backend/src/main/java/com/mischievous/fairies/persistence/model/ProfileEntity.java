package com.mischievous.fairies.persistence.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "profiles")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstname;

    @Column(nullable = false)
    private String lastname;

    @Column(nullable = true)
    private String profilePictureUrl;

    @OneToOne
    @JoinColumn(name = "account_id", nullable = false, unique = true)
    private AccountEntity account;

    @ManyToMany
    @JoinTable(
            name = "profile_allergens",
            joinColumns = @JoinColumn(name = "profile_id"),
            inverseJoinColumns = @JoinColumn(name = "allergen_id")
    )
    private List<AllergenEntity> allergens = new ArrayList();

    @ManyToMany
    @JoinTable(
            name = "profile_food_tags",
            joinColumns = @JoinColumn(name = "profile_id"),
            inverseJoinColumns = @JoinColumn(name = "food_tag_id")
    )
    private List<FoodTagEntity> foodTags = new ArrayList();
}