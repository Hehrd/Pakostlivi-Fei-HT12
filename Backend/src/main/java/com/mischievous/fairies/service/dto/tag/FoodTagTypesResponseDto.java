package com.mischievous.fairies.service.dto.tag;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class FoodTagTypesResponseDto {
    private List<String> tags = new ArrayList<>();
}
