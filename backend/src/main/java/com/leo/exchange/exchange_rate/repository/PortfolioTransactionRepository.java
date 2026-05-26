package com.leo.exchange.exchange_rate.repository;

import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.repository.custom.PortfolioTransactionRepositoryCustom;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioTransactionRepository
        extends JpaRepository<PortfolioTransaction, Long>, PortfolioTransactionRepositoryCustom {

    List<PortfolioTransaction> findByUserKey(String userKey);

    List<PortfolioTransaction> findByPortfolioId(Long portfolioId);

    List<PortfolioTransaction> findByUserKeyOrderByTransactionDateAscIdAsc(String userKey);

    List<PortfolioTransaction> findByPortfolioIdOrderByTransactionDateAscIdAsc(Long portfolioId);

    List<PortfolioTransaction> findByUserKeyAndNormalizedCurUnitOrderByTransactionDateAscIdAsc(
            String userKey,
            String normalizedCurUnit
    );

    List<PortfolioTransaction> findByPortfolioIdAndNormalizedCurUnitOrderByTransactionDateAscIdAsc(
            Long portfolioId,
            String normalizedCurUnit
    );

    List<PortfolioTransaction> findByUserKeyOrderByCreatedAtDesc(String userKey);

    Optional<PortfolioTransaction> findByIdAndUserKey(Long id, String userKey);

    Optional<PortfolioTransaction> findByIdAndUserKeyAndPortfolioId(Long id, String userKey, Long portfolioId);

    void deleteByPortfolioId(Long portfolioId);
}
