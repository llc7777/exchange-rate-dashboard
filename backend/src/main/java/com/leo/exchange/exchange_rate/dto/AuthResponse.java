package com.leo.exchange.exchange_rate.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        AuthUserResponse user
) {
}
