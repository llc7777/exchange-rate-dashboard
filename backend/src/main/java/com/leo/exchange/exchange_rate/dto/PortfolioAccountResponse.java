package com.leo.exchange.exchange_rate.dto;

import com.leo.exchange.exchange_rate.entity.PortfolioAccount;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PortfolioAccountResponse(
        Long id,
        String name,
        String investmentCurrency,
        BigDecimal cashBalance,
        BigDecimal totalDeposited,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static PortfolioAccountResponse from(PortfolioAccount account) {
        return new PortfolioAccountResponse(
                account.getId(),
                account.getName(),
                account.getInvestmentCurrency(),
                account.getCashBalance(),
                account.getTotalDeposited(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }
}
