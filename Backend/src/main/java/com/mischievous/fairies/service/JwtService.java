package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.JwtValidationService;
import com.mischievous.fairies.auth.RefreshTokenHasher;
import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.common.exceptions.InvalidTokenException;
import com.mischievous.fairies.common.exceptions.WrongCredentialsException;
import com.mischievous.fairies.persistence.model.JwtEntity;
import com.mischievous.fairies.persistence.model.AccountEntity;
import com.mischievous.fairies.persistence.repository.JwtRepository;
import com.mischievous.fairies.persistence.status.AccountRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Key;
import java.util.Date;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {

    private static final long ACCESS_EXPIRATION_MS = 1000L * 60 * 15;
    private static final long REFRESH_EXPIRATION_MS = 1000L * 60 * 60 * 24 * 30;

    private final JwtRepository jwtRepository;
    private final JwtValidationService jwtValidationService;
    private final RefreshTokenHasher refreshTokenHasher;
    private final Key key;

    public JwtService(
            JwtRepository jwtRepository,
            JwtValidationService jwtValidationService,
            RefreshTokenHasher refreshTokenHasher,
            Key key
    ) {
        this.jwtRepository = jwtRepository;
        this.jwtValidationService = jwtValidationService;
        this.refreshTokenHasher = refreshTokenHasher;
        this.key = key;
    }

    public String generateAccessToken(Long userId, String email, AccountRole accountRole) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", accountRole)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ACCESS_EXPIRATION_MS))
                .setId(UUID.randomUUID().toString())
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + REFRESH_EXPIRATION_MS))
                .setId(UUID.randomUUID().toString())
                .signWith(key)
                .compact();
    }

    @Transactional
    public void revokeAllUserTokens(AccountEntity user) {
        List<JwtEntity> activeTokens = jwtRepository.findAllByUserAccountAndRevokedFalse(user);

        for (JwtEntity token : activeTokens) {
            token.setRevoked(true);
        }

        jwtRepository.saveAll(activeTokens);
    }

    @Transactional
    public void saveRefreshToken(String rawRefreshToken, AccountEntity user) {
        Claims claims = jwtValidationService.parseClaims(rawRefreshToken);

        JwtEntity entity = new JwtEntity();
        entity.setJti(claims.getId());
        entity.setTokenHash(refreshTokenHasher.hash(rawRefreshToken));
        entity.setIssuedAt(claims.getIssuedAt().toInstant());
        entity.setExpiresAt(claims.getExpiration().toInstant());
        entity.setRevoked(false);
        entity.setUserAccount(user);

        jwtRepository.save(entity);
    }

    @Transactional
    public AuthTokens refreshTokens(String rawRefreshToken) throws WrongCredentialsException {
        if (rawRefreshToken == null || !jwtValidationService.validateToken(rawRefreshToken)) {
            throw new WrongCredentialsException("Invalid credentials");
        }

        Claims claims = jwtValidationService.parseClaims(rawRefreshToken);
        String jti = claims.getId();
        String tokenHash = refreshTokenHasher.hash(rawRefreshToken);

        JwtEntity storedToken = jwtRepository.findByJti(jti)
                .orElseThrow(() -> new WrongCredentialsException("Invalid credentials"));

        if (storedToken.isRevoked()) {
            throw new WrongCredentialsException("Invalid credentials");
        }

        if (!storedToken.getTokenHash().equals(tokenHash)) {
            throw new WrongCredentialsException("Invalid credentials");
        }

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new WrongCredentialsException("Invalid credentials");
        }

        storedToken.setRevoked(true);
        jwtRepository.save(storedToken);

        AccountEntity user = storedToken.getUserAccount();

        String newAccessToken = generateAccessToken(user.getId(),
                                                    user.getEmail(),
                                                    user.getRole());
        String newRefreshToken = generateRefreshToken(user.getId());

        saveRefreshToken(newRefreshToken, user);

        return new AuthTokens(newAccessToken, newRefreshToken);
    }

    @Transactional
    public void revokeRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || !jwtValidationService.validateToken(rawRefreshToken)) {
            return;
        }

        Claims claims = jwtValidationService.parseClaims(rawRefreshToken);

        jwtRepository.findByJti(claims.getId()).ifPresent(token -> {
            token.setRevoked(true);
            jwtRepository.save(token);
        });
    }

    public Long extractUserIdFromToken(String token) {
        if (token == null || !jwtValidationService.validateToken(token)) {
            throw new InvalidTokenException("invalid token");
        }

        Claims claims = jwtValidationService.parseClaims(token);
        return Long.valueOf(claims.getSubject());
    }

    @Transactional
    public void deleteExpiredTokens() {
        jwtRepository.deleteAllByExpiresAtBefore(Instant.now());
    }
}