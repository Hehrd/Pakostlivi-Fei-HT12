package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.response.tag.AllergenResponseDTO;
import com.mischievous.fairies.controller.dtos.response.tag.FoodTagResponseDTO;
import com.mischievous.fairies.persistence.status.FoodTagType;
import com.mischievous.fairies.service.TagService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/tags")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping("/food")
    public ResponseEntity<List<FoodTagResponseDTO>> getAllTags() {
        return ResponseEntity.ok(tagService.getAllTags());
    }

    @GetMapping("/allergens")
    public ResponseEntity<List<AllergenResponseDTO>> getAllAllergens() {
        return ResponseEntity.ok(tagService.getAllAllergens());
    }
}