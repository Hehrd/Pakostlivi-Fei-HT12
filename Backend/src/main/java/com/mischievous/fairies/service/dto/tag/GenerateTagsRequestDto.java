package com.mischievous.fairies.service.dto.tag;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateTagsRequestDto {
    private String name;
    private String description;
}
