package com.mischievous.fairies.persistence.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "clients")
public class ClientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstname;

    @Column(nullable = false)
    private String lastname;

    @Column()
    private String profilePictureUrl;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AccountEntity account;
}