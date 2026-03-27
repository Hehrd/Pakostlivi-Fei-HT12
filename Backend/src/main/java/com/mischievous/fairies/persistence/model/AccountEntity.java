package com.mischievous.fairies.persistence.model;

import com.mischievous.fairies.persistence.status.AccountRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
public class AccountEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    @NotBlank
    private String email;

    @OneToOne(mappedBy = "account", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ProfileEntity profile;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @NotNull
    private AccountRole role;

    @Column(nullable = false, length = 255)
    private String passwordHash;

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
