package com.mischievous.fairies.controller;


import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.common.exceptions.EmailAlreadyInUseException;
import com.mischievous.fairies.common.exceptions.WrongCredentialsException;
import com.mischievous.fairies.controller.dtos.request.UserLogInDTO;
import com.mischievous.fairies.controller.dtos.request.UserSignUpDTO;
import com.mischievous.fairies.controller.dtos.response.CurrentUserDTO;
import com.mischievous.fairies.service.AuthCookieService;
import com.mischievous.fairies.service.UserAccountService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/account")
public class UserAccountController {

    private final UserAccountService userAccountService;
    private final AuthCookieService authCookieService;

    public UserAccountController(UserAccountService userAccountService, AuthCookieService authCookieService) {
        this.userAccountService = userAccountService;
        this.authCookieService = authCookieService;
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserDTO> me(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(new CurrentUserDTO(user.userId(), user.email()));
    }

    @PostMapping("/signup")
    public ResponseEntity<Void> signUp(@Valid @RequestBody UserSignUpDTO userSignUpDTO, HttpServletResponse response) throws EmailAlreadyInUseException {
        userAccountService.signUp(userSignUpDTO);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .build();
    }

    @PostMapping("/login")
    public ResponseEntity<Void> logIn(@Valid @RequestBody UserLogInDTO userLogInDTO, HttpServletResponse response) throws WrongCredentialsException {
        AuthTokens tokens = userAccountService.logIn(userLogInDTO);

        authCookieService.addAccessTokenCookie(response, tokens.accessToken());
        authCookieService.addRefreshTokenCookie(response, tokens.refreshToken());

        return ResponseEntity
                .ok()
                .build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logOut(@CookieValue(name = "refresh_token", required = false) String refreshToken, HttpServletResponse response) {
        userAccountService.logOut(refreshToken);
        authCookieService.clearCookies(response);

        return ResponseEntity
                .ok()
                .build();
    }
}