package com.leo.exchange.exchange_rate.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PortfolioAccountCreateRequest(
        String name,
        @NotBlank(message = "Investment currency is required.")
        String investmentCurrency,
        @NotNull(message = "Initial deposit amount is required.")
        @DecimalMin(value = "0.0", inclusive = false, message = "Initial deposit amount must be greater than zero.")
        BigDecimal initialDepositAmount,
        String memo
) {
}
