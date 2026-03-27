package com.mischievous.fairies.controller.dtos.response.tag;

import com.mischievous.fairies.persistence.status.AllergenType;
import com.mischievous.fairies.persistence.status.FoodTagType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AllergenResponseDTO {
    private Long id;
    private AllergenType type;
}
