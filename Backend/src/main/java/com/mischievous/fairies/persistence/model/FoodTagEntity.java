package com.mischievous.fairies.persistence.model;

import com.mischievous.fairies.persistence.status.FoodTagType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "food_tags")
@AllArgsConstructor
@NoArgsConstructor
public class FoodTagEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private FoodTagType type;
}
