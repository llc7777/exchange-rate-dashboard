package com.leo.exchange.exchange_rate.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ExchangeCalculateRequest(
        @NotBlank String fromCurrency,
        @NotBlank String toCurrency,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal amount
) {
}
