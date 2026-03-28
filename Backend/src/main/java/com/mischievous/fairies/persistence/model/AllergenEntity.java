package com.mischievous.fairies.persistence.model;

import com.mischievous.fairies.persistence.status.AllergenType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

@Data
@Entity
@Table(name = "allergens")
@AllArgsConstructor
@NoArgsConstructor
public class AllergenEntity implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private AllergenType type;
}
