package com.mischievous.fairies.persistence.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "stripe_accounts")
@Data
public class StripeAccountEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String stripeAccountId;

    @Column()
    private boolean isActive;

    @OneToOne(fetch = FetchType.LAZY, mappedBy = "stripeAccount", cascade = CascadeType.ALL)
    private RestaurantEntity restaurant;
}
