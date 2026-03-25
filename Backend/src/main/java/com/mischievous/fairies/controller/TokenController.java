package com.mischievous.fairies.controller;


import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.common.exceptions.WrongCredentialsException;
import com.mischievous.fairies.service.AuthCookieService;
import com.mischievous.fairies.service.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/token")
public class TokenController {

    private final JwtService jwtService;
    private final AuthCookieService authCookieService;

    public TokenController(JwtService jwtService, AuthCookieService authCookieService) {
        this.jwtService = jwtService;
        this.authCookieService = authCookieService;
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(@CookieValue(name = "refresh_token", required = false) String refreshToken, HttpServletResponse response) throws WrongCredentialsException {
        AuthTokens tokens = jwtService.refreshTokens(refreshToken);

        authCookieService.addAccessTokenCookie(response, tokens.accessToken());
        authCookieService.addRefreshTokenCookie(response, tokens.refreshToken());

        return ResponseEntity
                .ok()
                .build();
    }
}