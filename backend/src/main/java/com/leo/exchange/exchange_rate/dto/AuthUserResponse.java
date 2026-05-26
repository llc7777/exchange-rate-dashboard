package com.leo.exchange.exchange_rate.dto;

import com.leo.exchange.exchange_rate.entity.AuthUser;

public record AuthUserResponse(
        Long id,
        String email,
        String name
) {

    public static AuthUserResponse from(AuthUser user) {
        return new AuthUserResponse(user.getId(), user.getEmail(), user.getName());
    }
}
