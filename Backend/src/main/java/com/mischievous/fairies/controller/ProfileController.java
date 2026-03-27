package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.user.UpdateProfileDto;
import com.mischievous.fairies.controller.dtos.response.user.UserProfileResDto;
import com.mischievous.fairies.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profiles")
public class ProfileController {
    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileResDto> getProfile(@PathVariable("id") Long accountId) {
        return ResponseEntity.ok(profileService.getUserProfileByAccountId(accountId));
    }

    @PutMapping()
    public ResponseEntity<UserProfileResDto> updateProfile(@RequestBody UpdateProfileDto updateProfileDto) {
        return ResponseEntity.ok(profileService.updateUserProfile(updateProfileDto));
    }
}
