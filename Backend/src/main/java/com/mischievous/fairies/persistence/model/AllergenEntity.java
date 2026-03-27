package com.mischievous.fairies.persistence.model;

import com.mischievous.fairies.persistence.status.AllergenType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "allergens")
@AllArgsConstructor
@NoArgsConstructor
public class AllergenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private AllergenType type;
}