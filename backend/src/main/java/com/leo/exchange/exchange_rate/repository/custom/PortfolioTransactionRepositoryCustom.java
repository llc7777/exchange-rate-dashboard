package com.leo.exchange.exchange_rate.repository.custom;

import com.leo.exchange.exchange_rate.dto.PortfolioTransactionSearchCondition;
import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PortfolioTransactionRepositoryCustom {

    Page<PortfolioTransaction> searchTransactions(
            PortfolioTransactionSearchCondition condition,
            Pageable pageable
    );
}
