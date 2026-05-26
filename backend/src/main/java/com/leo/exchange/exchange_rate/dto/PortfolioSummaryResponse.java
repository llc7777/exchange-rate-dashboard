package com.leo.exchange.exchange_rate.dto;

import com.leo.exchange.exchange_rate.entity.PortfolioChangeStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PortfolioSummaryResponse(
        String investmentCurrency,
        BigDecimal cashBalance,
        BigDecimal totalDeposited,
        BigDecimal investedCost,
        BigDecimal currencyValue,
        BigDecimal totalAssetValue,
        BigDecimal profitLoss,
        BigDecimal profitLossRate,
        PortfolioChangeStatus changeStatus,
        int positionCount,
        LocalDate baseDate
) {
}
