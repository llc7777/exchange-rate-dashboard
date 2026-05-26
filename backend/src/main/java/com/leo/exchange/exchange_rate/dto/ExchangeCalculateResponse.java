package com.leo.exchange.exchange_rate.dto;

import java.math.BigDecimal;

public record ExchangeCalculateResponse(
        String fromCurrency,
        String toCurrency,
        BigDecimal amount,
        BigDecimal convertedAmount,
        BigDecimal appliedRate
) {
}
