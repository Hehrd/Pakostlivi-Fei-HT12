package com.mischievous.fairies.auth.filter;

import com.mischievous.fairies.persistence.status.AccountRole;

public record AuthenticatedUser(Long userId, String email, AccountRole role) {
}