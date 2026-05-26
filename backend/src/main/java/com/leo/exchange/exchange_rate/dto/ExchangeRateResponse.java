package com.leo.exchange.exchange_rate.dto;

import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExchangeRateResponse(
        Long id,
        String curUnit,
        String normalizedCurUnit,
        String curName,
        BigDecimal ttb,
        BigDecimal tts,
        BigDecimal dealBasR,
        BigDecimal bkpr,
        BigDecimal yyEfeeR,
        BigDecimal tenDdEfeeR,
        BigDecimal kftcDealBasR,
        BigDecimal kftcBkpr,
        LocalDate baseDate,
        BigDecimal changeAmount,
        BigDecimal changeRate,
        boolean favorite
) {

    public static ExchangeRateResponse from(ExchangeRate exchangeRate, boolean favorite) {
        return new ExchangeRateResponse(
                exchangeRate.getId(),
                exchangeRate.getCurUnit(),
                exchangeRate.getNormalizedCurUnit(),
                exchangeRate.getCurName(),
                exchangeRate.getTtb(),
                exchangeRate.getTts(),
                exchangeRate.getDealBasR(),
                exchangeRate.getBkpr(),
                exchangeRate.getYyEfeeR(),
                exchangeRate.getTenDdEfeeR(),
                exchangeRate.getKftcDealBasR(),
                exchangeRate.getKftcBkpr(),
                exchangeRate.getBaseDate(),
                exchangeRate.getChangeAmount(),
                exchangeRate.getChangeRate(),
                favorite
        );
    }

    public ExchangeRateResponse withFavorite(boolean favorite) {
        return new ExchangeRateResponse(id, curUnit, normalizedCurUnit, curName, ttb, tts, dealBasR, bkpr,
                yyEfeeR, tenDdEfeeR, kftcDealBasR, kftcBkpr, baseDate, changeAmount, changeRate, favorite);
    }

    public ExchangeRateResponse withChange(BigDecimal changeAmount, BigDecimal changeRate) {
        return new ExchangeRateResponse(id, curUnit, normalizedCurUnit, curName, ttb, tts, dealBasR, bkpr,
                yyEfeeR, tenDdEfeeR, kftcDealBasR, kftcBkpr, baseDate, changeAmount, changeRate, favorite);
    }
}
