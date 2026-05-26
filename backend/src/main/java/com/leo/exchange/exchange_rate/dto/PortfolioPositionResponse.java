package com.leo.exchange.exchange_rate.dto;

import com.leo.exchange.exchange_rate.entity.PortfolioChangeStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PortfolioPositionResponse(
        String investmentCurrency,
        String curUnit,
        String normalizedCurUnit,
        String curName,
        BigDecimal holdingForeignAmount,
        BigDecimal averageBuyRate,
        BigDecimal investedCost,
        BigDecimal currentRate,
        BigDecimal currentValue,
        BigDecimal profitLoss,
        BigDecimal profitLossRate,
        PortfolioChangeStatus changeStatus,
        LocalDate baseDate
) {
}
