package com.mischievous.fairies.service;

import com.mischievous.fairies.controller.dtos.response.tag.AllergenResponseDTO;
import com.mischievous.fairies.controller.dtos.response.tag.FoodTagResponseDTO;
import com.mischievous.fairies.persistence.model.AllergenEntity;
import com.mischievous.fairies.persistence.model.FoodTagEntity;
import com.mischievous.fairies.persistence.repository.AllergenRepository;
import com.mischievous.fairies.persistence.repository.FoodTagRepository;
import com.mischievous.fairies.persistence.status.AllergenType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TagService {
    private final FoodTagRepository foodTagRepository;
    private final AllergenRepository allergenRepository;
    
    public TagService(FoodTagRepository foodTagRepository, AllergenRepository allergenRepository) {
        this.foodTagRepository = foodTagRepository;
        this.allergenRepository = allergenRepository;
    }
    
    public List<FoodTagResponseDTO> getAllTags() {
        List<FoodTagEntity> entities = foodTagRepository.findAll();
        List<FoodTagResponseDTO> dtos = new ArrayList<>();
        for (FoodTagEntity entity : entities) {
            dtos.add(toDto(entity));
        }
        return dtos;
    }
    public List<AllergenResponseDTO> getAllAllergens() {
        List<AllergenEntity> entities = allergenRepository.findAll();
        List<AllergenResponseDTO> dtos = new ArrayList<>();
        for (AllergenEntity entity : entities) {
            dtos.add(toDto(entity));
        }
        return dtos;
    }

    private AllergenResponseDTO toDto(AllergenEntity entity) {
        AllergenResponseDTO dto = new AllergenResponseDTO();
        dto.setId(entity.getId());
        dto.setType(entity.getType());
        return dto;
    }

    private FoodTagResponseDTO toDto(FoodTagEntity foodTagEntity) {
        FoodTagResponseDTO dto = new FoodTagResponseDTO();
        dto.setId(foodTagEntity.getId());
        dto.setType(foodTagEntity.getType());
        return dto;
    }


}
