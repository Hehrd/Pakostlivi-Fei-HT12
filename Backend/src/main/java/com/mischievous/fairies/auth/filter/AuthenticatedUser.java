package com.mischievous.fairies.auth.filter;

public record AuthenticatedUser(Integer userId, String email) {
}