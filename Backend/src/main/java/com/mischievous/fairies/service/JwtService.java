package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.JwtValidation;
import com.mischievous.fairies.auth.RefreshTokenHasher;
import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.common.exceptions.WrongCredentialsException;
import com.mischievous.fairies.persistence.model.JwtEntity;
import com.mischievous.fairies.persistence.model.UserAccountEntity;
import com.mischievous.fairies.persistence.repository.JwtRepository;
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
    private final JwtValidation jwtValidation;
    private final RefreshTokenHasher refreshTokenHasher;
    private final Key key;

    public JwtService(
            JwtRepository jwtRepository,
            JwtValidation jwtValidation,
            RefreshTokenHasher refreshTokenHasher,
            Key key
    ) {
        this.jwtRepository = jwtRepository;
        this.jwtValidation = jwtValidation;
        this.refreshTokenHasher = refreshTokenHasher;
        this.key = key;
    }

    public String generateAccessToken(Integer userId, String email) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .claim("email", email)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ACCESS_EXPIRATION_MS))
                .setId(UUID.randomUUID().toString())
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(Integer userId) {
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
    public void revokeAllUserTokens(UserAccountEntity user) {
        List<JwtEntity> activeTokens = jwtRepository.findAllByUserAccountAndRevokedFalse(user);

        for (JwtEntity token : activeTokens) {
            token.setRevoked(true);
        }

        jwtRepository.saveAll(activeTokens);
    }

    @Transactional
    public void saveRefreshToken(String rawRefreshToken, UserAccountEntity user) {
        Claims claims = jwtValidation.parseClaims(rawRefreshToken);

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
        if (rawRefreshToken == null || !jwtValidation.validateToken(rawRefreshToken)) {
            throw new WrongCredentialsException("Invalid credentials");
        }

        Claims claims = jwtValidation.parseClaims(rawRefreshToken);
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

        UserAccountEntity user = storedToken.getUserAccount();

        String newAccessToken = generateAccessToken(user.getId(), user.getEmail());
        String newRefreshToken = generateRefreshToken(user.getId());

        saveRefreshToken(newRefreshToken, user);

        return new AuthTokens(newAccessToken, newRefreshToken);
    }

    @Transactional
    public void revokeRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || !jwtValidation.validateToken(rawRefreshToken)) {
            return;
        }

        Claims claims = jwtValidation.parseClaims(rawRefreshToken);

        jwtRepository.findByJti(claims.getId()).ifPresent(token -> {
            token.setRevoked(true);
            jwtRepository.save(token);
        });
    }

    @Transactional
    public void deleteExpiredTokens() {
        jwtRepository.deleteAllByExpiresAtBefore(Instant.now());
    }
}