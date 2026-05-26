package com.leo.exchange.exchange_rate.dto;

import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import java.time.LocalDate;

public record PortfolioTransactionSearchCondition(
        String userKey,
        Long portfolioId,
        String normalizedCurUnit,
        PortfolioTransactionType transactionType,
        LocalDate fromDate,
        LocalDate toDate
) {
}
