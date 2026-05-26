package com.leo.exchange.exchange_rate.security;

public record AuthPrincipal(
        Long userId,
        String email,
        String userKey,
        String name
) {
}
