package com.leo.exchange.exchange_rate.controller;

import com.leo.exchange.exchange_rate.dto.AuthLoginRequest;
import com.leo.exchange.exchange_rate.dto.AuthRegisterRequest;
import com.leo.exchange.exchange_rate.dto.AuthResponse;
import com.leo.exchange.exchange_rate.dto.AuthUserResponse;
import com.leo.exchange.exchange_rate.exception.UnauthorizedException;
import com.leo.exchange.exchange_rate.security.AuthPrincipal;
import com.leo.exchange.exchange_rate.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody AuthRegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthLoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthUserResponse me(@AuthenticationPrincipal AuthPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Login is required.");
        }
        return authService.me(principal);
    }
}
