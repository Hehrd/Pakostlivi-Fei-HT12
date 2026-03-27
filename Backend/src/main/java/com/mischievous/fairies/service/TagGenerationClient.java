package com.mischievous.fairies.service;

import com.mischievous.fairies.common.CustomException;
import com.mischievous.fairies.service.dto.tag.FoodTagTypesResponseDto;
import com.mischievous.fairies.service.dto.tag.GenerateTagsRequestDto;
import com.mischievous.fairies.service.dto.tag.GenerateTagsResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class TagGenerationClient {
    private final RestClient fastApiRestClient;

    public TagGenerationClient(RestClient fastApiRestClient) {
        this.fastApiRestClient = fastApiRestClient;
    }

    public List<String> generateTags(String name, String description) {
        try {
            GenerateTagsResponseDto body = fastApiRestClient.post()
                    .uri("/tag/generate")
                    .body(new GenerateTagsRequestDto(name, description))
                    .retrieve()
                    .body(GenerateTagsResponseDto.class);

            if (body == null || body.getTags() == null || body.getTags().isEmpty()) {
                throw new CustomException("FastAPI tag generation failed or returned no tags", HttpStatus.BAD_GATEWAY);
            }

            return body.getTags();
        } catch (RestClientException e) {
            throw new CustomException("Failed to generate tags from FastAPI", HttpStatus.BAD_GATEWAY);
        }
    }

    public List<String> fetchKnownTagTypes() {
        try {
            FoodTagTypesResponseDto body = fastApiRestClient.get()
                    .uri("/tag/types")
                    .retrieve()
                    .body(FoodTagTypesResponseDto.class);

            if (body == null || body.getTags() == null || body.getTags().isEmpty()) {
                throw new CustomException("Failed to fetch FoodTagType values from FastAPI", HttpStatus.BAD_GATEWAY);
            }

            return body.getTags();
        } catch (RestClientException e) {
            throw new CustomException("Failed to fetch FoodTagType values from FastAPI", HttpStatus.BAD_GATEWAY);
        }
    }
}
