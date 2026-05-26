package com.leo.exchange.exchange_rate.dto;

import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PortfolioTransactionResponse(
        Long id,
        String curUnit,
        String normalizedCurUnit,
        String curName,
        PortfolioTransactionType transactionType,
        LocalDate transactionDate,
        BigDecimal foreignAmount,
        BigDecimal exchangeRate,
        BigDecimal unitFactor,
        BigDecimal amount,
        String memo,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static PortfolioTransactionResponse from(PortfolioTransaction transaction, String curName) {
        String displayName = transaction.getTransactionType() == PortfolioTransactionType.DEPOSIT
                ? transaction.getCurUnit() + " Deposit"
                : curName;
        return new PortfolioTransactionResponse(
                transaction.getId(),
                transaction.getCurUnit(),
                transaction.getNormalizedCurUnit(),
                displayName,
                transaction.getTransactionType(),
                transaction.getTransactionDate(),
                transaction.getForeignAmount(),
                transaction.getExchangeRate(),
                transaction.getUnitFactor(),
                transaction.getKrwAmount(),
                transaction.getMemo(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt()
        );
    }
}
