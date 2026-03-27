package com.mischievous.fairies.controller;

import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.common.exceptions.EmailAlreadyInUseException;
import com.mischievous.fairies.common.exceptions.WrongCredentialsException;
import com.mischievous.fairies.controller.dtos.request.user.SignUpReqDTO;
import com.mischievous.fairies.controller.dtos.request.user.UserReqLogInDTO;
import com.mischievous.fairies.controller.dtos.response.user.CurrentUserDTO;
import com.mischievous.fairies.controller.dtos.response.user.UserProfileResDto;
import com.mischievous.fairies.controller.dtos.response.user.UserResLogInDTO;
import com.mischievous.fairies.service.AuthCookieService;
import com.mischievous.fairies.service.AccountService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/account")
public class UserAccountController {

    private final AccountService accountService;
    private final AuthCookieService authCookieService;

    public UserAccountController(AccountService accountService,
                                 AuthCookieService authCookieService) {
        this.accountService = accountService;
        this.authCookieService = authCookieService;
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserDTO> me(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(new CurrentUserDTO(user.userId(), user.email(), user.role()));
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Boolean>> signUp(@Valid @RequestBody SignUpReqDTO signUpReqDTO) throws EmailAlreadyInUseException {
        Map<String, Boolean> response = accountService.signUp(signUpReqDTO);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResLogInDTO> logIn(@Valid @RequestBody UserReqLogInDTO userReqLogInDTO, HttpServletResponse response) throws WrongCredentialsException {
        AccountService.LoginAuth auth = accountService.logIn(userReqLogInDTO);

        authCookieService.addAccessTokenCookie(response, auth.getTokens().accessToken());
        authCookieService.addRefreshTokenCookie(response, auth.getTokens().refreshToken());

        return ResponseEntity
                .ok()
                .body(auth.getResDto());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logOut(@CookieValue(name = "refresh_token", required = false) String refreshToken, HttpServletResponse response) {
        accountService.logOut(refreshToken);
        authCookieService.clearCookies(response);

        return ResponseEntity
                .ok()
                .build();
    }

}