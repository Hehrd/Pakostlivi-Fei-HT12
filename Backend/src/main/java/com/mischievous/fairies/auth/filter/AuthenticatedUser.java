package com.mischievous.fairies.auth.filter;

public record AuthenticatedUser(Long userId, String email) {
}