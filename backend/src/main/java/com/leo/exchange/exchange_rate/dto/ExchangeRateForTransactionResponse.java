package com.leo.exchange.exchange_rate.dto;

import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExchangeRateForTransactionResponse(
        String curUnit,
        String normalizedCurUnit,
        String curName,
        LocalDate baseDate,
        BigDecimal dealBasR,
        BigDecimal unitFactor
) {

    public static ExchangeRateForTransactionResponse from(ExchangeRate rate, BigDecimal unitFactor) {
        return new ExchangeRateForTransactionResponse(
                rate.getCurUnit(),
                rate.getNormalizedCurUnit(),
                rate.getCurName(),
                rate.getBaseDate(),
                rate.getDealBasR(),
                unitFactor
        );
    }
}
