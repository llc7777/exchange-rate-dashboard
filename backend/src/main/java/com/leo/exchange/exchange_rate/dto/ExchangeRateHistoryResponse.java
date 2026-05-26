package com.leo.exchange.exchange_rate.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExchangeRateHistoryResponse(
        LocalDate baseDate,
        BigDecimal dealBasR
) {
}
