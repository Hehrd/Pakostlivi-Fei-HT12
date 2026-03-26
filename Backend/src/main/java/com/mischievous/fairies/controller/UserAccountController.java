package com.mischievous.fairies.controller;

import com.mischievous.fairies.auth.filter.AuthTokens;
import com.mischievous.fairies.auth.filter.AuthenticatedUser;
import com.mischievous.fairies.common.exceptions.EmailAlreadyInUseException;
import com.mischievous.fairies.common.exceptions.WrongCredentialsException;
import com.mischievous.fairies.controller.dtos.request.SignUpReqDTO;
import com.mischievous.fairies.controller.dtos.request.UserReqLogInDTO;
import com.mischievous.fairies.controller.dtos.response.ClientResDTO;
import com.mischievous.fairies.controller.dtos.response.CurrentUserDTO;
import com.mischievous.fairies.service.AuthCookieService;
import com.mischievous.fairies.service.AccountService;
import com.mischievous.fairies.service.ClientService;
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
    private final ClientService clientService;

    public UserAccountController(AccountService accountService,
                                 AuthCookieService authCookieService,
                                 ClientService clientService) {
        this.accountService = accountService;
        this.authCookieService = authCookieService;
        this.clientService = clientService;
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserDTO> me(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return ResponseEntity.ok(new CurrentUserDTO(user.userId(), user.email()));
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Boolean>> signUp(@Valid @RequestBody SignUpReqDTO signUpReqDTO) throws EmailAlreadyInUseException {
        Map<String, Boolean> response = accountService.signUp(signUpReqDTO.getUser());
        clientService.saveUser(signUpReqDTO.getClient(), signUpReqDTO.getUser().getEmail());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ClientResDTO> logIn(@Valid @RequestBody UserReqLogInDTO userReqLogInDTO, HttpServletResponse response) throws WrongCredentialsException {
        AuthTokens tokens = accountService.logIn(userReqLogInDTO);

        authCookieService.addAccessTokenCookie(response, tokens.accessToken());
        authCookieService.addRefreshTokenCookie(response, tokens.refreshToken());
        ClientResDTO clientResDTO = clientService.getClientByEmail(userReqLogInDTO.getEmail());

        return ResponseEntity
                .ok()
                .body(clientResDTO);
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