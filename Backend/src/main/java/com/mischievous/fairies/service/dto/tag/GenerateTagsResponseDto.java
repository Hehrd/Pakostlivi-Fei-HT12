package com.mischievous.fairies.service.dto.tag;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class GenerateTagsResponseDto {
    private List<String> tags = new ArrayList<>();
}
