package com.leo.exchange.exchange_rate.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PortfolioDepositRequest(
        Long portfolioId,
        @NotNull(message = "Deposit amount is required.")
        @DecimalMin(value = "0.0", inclusive = false, message = "Deposit amount must be greater than zero.")
        @JsonAlias("amountKrw")
        BigDecimal amount,
        String memo
) {
}
