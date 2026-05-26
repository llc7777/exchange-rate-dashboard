package com.leo.exchange.exchange_rate.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PortfolioSellRequest(
        Long portfolioId,
        @NotBlank(message = "Currency is required.")
        String curUnit,
        @NotNull(message = "Foreign amount is required.")
        @DecimalMin(value = "0.0", inclusive = false, message = "Foreign amount must be greater than zero.")
        BigDecimal foreignAmount,
        String memo
) {
}
