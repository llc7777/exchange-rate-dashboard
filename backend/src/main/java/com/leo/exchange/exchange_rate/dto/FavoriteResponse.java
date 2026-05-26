package com.leo.exchange.exchange_rate.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FavoriteResponse(
        String curUnit,
        String normalizedCurUnit,
        String curName,
        BigDecimal ttb,
        BigDecimal tts,
        BigDecimal dealBasR,
        BigDecimal changeAmount,
        BigDecimal changeRate,
        LocalDate baseDate
) {
}
