package com.leo.exchange.exchange_rate.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AuthRegisterRequest(
        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be a valid email address.")
        String email,

        @NotBlank(message = "Password is required.")
        @Pattern(
                regexp = "^(?=.*[^A-Za-z0-9]).{8,100}$",
                message = "Password must be at least 8 characters and include at least one special character."
        )
        String password,

        @NotBlank(message = "Name is required.")
        @Size(max = 100, message = "Name must be 100 characters or fewer.")
        String name
) {
}
