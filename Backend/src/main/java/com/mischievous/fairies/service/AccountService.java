package com.mischievous.fairies.service;

import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.common.exceptions.EmailAlreadyInUseException;
import com.mischievous.fairies.common.exceptions.WrongCredentialsException;
import com.mischievous.fairies.controller.dtos.request.user.SignUpReqDTO;
import com.mischievous.fairies.controller.dtos.request.user.UserReqLogInDTO;
import com.mischievous.fairies.persistence.model.AccountEntity;
import com.mischievous.fairies.persistence.repository.AccountRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder;

    public AccountService(
            AccountRepository accountRepository,
            JwtService jwtService,
            BCryptPasswordEncoder passwordEncoder
    ) {
        this.accountRepository = accountRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Map<String, Boolean> signUp(SignUpReqDTO.UserReqSignUpDTO userReqSignUpDTO) throws EmailAlreadyInUseException {
        if (accountRepository.existsByEmail(userReqSignUpDTO.getEmail())) {
            throw new EmailAlreadyInUseException("Email is already in use");
        }

        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setEmail(userReqSignUpDTO.getEmail());
        accountEntity.setPasswordHash(passwordEncoder.encode(userReqSignUpDTO.getPassword()));
        accountEntity.setRole(userReqSignUpDTO.getRole());

        AccountEntity savedUser = accountRepository.save(accountEntity);

        return Map.of("ok", true);
    }

    @Transactional
    public AuthTokens logIn(UserReqLogInDTO dto) throws WrongCredentialsException {
        AccountEntity user = accountRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new WrongCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new WrongCredentialsException("Invalid credentials");
        }

        jwtService.revokeAllUserTokens(user);

        String accessToken = jwtService.generateAccessToken(user.getId(),
                                                            user.getEmail(),
                                                            user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId());
        jwtService.saveRefreshToken(refreshToken, user);

        return new AuthTokens(accessToken, refreshToken);
    }

    @Transactional
    public void logOut(String refreshToken) {
        jwtService.revokeRefreshToken(refreshToken);
    }
}