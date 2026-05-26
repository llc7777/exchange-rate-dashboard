package com.leo.exchange.exchange_rate.dto;

import java.util.List;

public record PortfolioDashboardResponse(
        PortfolioAccountResponse account,
        PortfolioSummaryResponse summary,
        List<PortfolioPositionResponse> positions,
        List<PortfolioTransactionResponse> recentTransactions
) {
}
