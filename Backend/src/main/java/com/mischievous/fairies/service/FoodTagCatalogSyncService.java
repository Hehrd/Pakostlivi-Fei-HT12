package com.mischievous.fairies.service;

import com.mischievous.fairies.common.CustomException;
import com.mischievous.fairies.persistence.model.FoodTagEntity;
import com.mischievous.fairies.persistence.repository.FoodTagRepository;
import com.mischievous.fairies.persistence.status.FoodTagType;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;

@Service
public class FoodTagCatalogSyncService {
    private final TagGenerationClient tagGenerationClient;
    private final FoodTagRepository foodTagRepository;

    public FoodTagCatalogSyncService(TagGenerationClient tagGenerationClient,
                                     FoodTagRepository foodTagRepository) {
        this.tagGenerationClient = tagGenerationClient;
        this.foodTagRepository = foodTagRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void syncCatalogAtStartup() {
        List<String> tagValues = tagGenerationClient.fetchKnownTagTypes();
        EnumSet<FoodTagType> knownTypes = EnumSet.noneOf(FoodTagType.class);

        for (String value : tagValues) {
            try {
                FoodTagType tagType = FoodTagType.valueOf(value.trim().toUpperCase());
                knownTypes.add(tagType);
                foodTagRepository.findByType(tagType)
                        .orElseGet(() -> foodTagRepository.save(new FoodTagEntity(null, tagType)));
            } catch (IllegalArgumentException ex) {
                throw new CustomException("FastAPI returned unsupported FoodTagType: " + value, HttpStatus.BAD_GATEWAY);
            }
        }

        if (knownTypes.size() != FoodTagType.values().length) {
            throw new CustomException("FastAPI FoodTagType catalog does not match Spring Boot enum", HttpStatus.BAD_GATEWAY);
        }
    }
}
