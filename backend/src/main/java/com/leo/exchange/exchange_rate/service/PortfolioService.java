package com.leo.exchange.exchange_rate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.leo.exchange.exchange_rate.cache.CacheService;
import com.leo.exchange.exchange_rate.config.ExchangeCacheProperties;
import com.leo.exchange.exchange_rate.dto.PortfolioAccountCreateRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioAccountResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioDashboardResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioPositionResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioSummaryResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioTransactionResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioTransactionSearchCondition;
import com.leo.exchange.exchange_rate.entity.PortfolioAccount;
import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import com.leo.exchange.exchange_rate.exception.DataNotFoundException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioAccountRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioService {

    private static final String KRW = "KRW";
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final PortfolioAccountRepository portfolioAccountRepository;
    private final PortfolioTransactionRepository portfolioTransactionRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyUnitService currencyUnitService;
    private final PortfolioCalculationService portfolioCalculationService;
    private final PortfolioTransactionService portfolioTransactionService;
    private final CacheService cacheService;
    private final ExchangeCacheProperties cacheProperties;

    @Transactional
    public PortfolioAccountResponse createAccount(String userKey, PortfolioAccountCreateRequest request) {
        String investmentCurrency = currencyUnitService.normalize(request.investmentCurrency());
        validateSupportedInvestmentCurrency(investmentCurrency);
        String name = StringUtils.hasText(request.name())
                ? request.name().trim()
                : investmentCurrency + " Portfolio";

        PortfolioAccount account = portfolioAccountRepository.save(PortfolioAccount.builder()
                .userKey(userKey)
                .name(name)
                .investmentCurrency(investmentCurrency)
                .cashBalance(request.initialDepositAmount())
                .totalDeposited(request.initialDepositAmount())
                .build());

        portfolioTransactionRepository.save(PortfolioTransaction.builder()
                .userKey(userKey)
                .portfolioId(account.getId())
                .curUnit(investmentCurrency)
                .normalizedCurUnit(investmentCurrency)
                .transactionType(PortfolioTransactionType.DEPOSIT)
                .transactionDate(LocalDate.now(SEOUL_ZONE))
                .foreignAmount(BigDecimal.ZERO)
                .exchangeRate(BigDecimal.ONE)
                .unitFactor(BigDecimal.ONE)
                .krwAmount(request.initialDepositAmount())
                .memo(request.memo())
                .build());
        evictPortfolioCaches(userKey, account.getId());
        return PortfolioAccountResponse.from(account);
    }

    public List<PortfolioAccountResponse> getAccounts(String userKey) {
        return portfolioAccountRepository.findByUserKeyOrderByCreatedAtAscIdAsc(userKey)
                .stream()
                .map(PortfolioAccountResponse::from)
                .toList();
    }

    @Transactional
    public void deleteAccount(String userKey, Long portfolioId) {
        PortfolioAccount account = portfolioAccountRepository.findByIdAndUserKey(portfolioId, userKey)
                .orElseThrow(() -> new DataNotFoundException("Portfolio account not found."));
        // 포트폴리오 삭제 시 해당 포트폴리오의 거래 내역도 함께 삭제한다.
        // Deletes all transactions that belong to the portfolio when the portfolio is removed.
        portfolioTransactionRepository.deleteByPortfolioId(account.getId());
        portfolioAccountRepository.delete(account);
        evictPortfolioCaches(userKey, account.getId());
    }

    public Optional<PortfolioAccount> findAccount(String userKey, Long portfolioId) {
        if (portfolioId != null) {
            return portfolioAccountRepository.findByIdAndUserKey(portfolioId, userKey);
        }
        return portfolioAccountRepository.findFirstByUserKeyOrderByCreatedAtAscIdAsc(userKey);
    }

    public PortfolioDashboardResponse getDashboard(String userKey, Long portfolioId) {
        Optional<PortfolioAccount> optionalAccount = findAccount(userKey, portfolioId);
        if (optionalAccount.isEmpty()) {
            return emptyDashboard();
        }
        PortfolioAccount account = optionalAccount.get();
        return cacheService.get(dashboardCacheKey(userKey, account.getId()), PortfolioDashboardResponse.class)
                .orElseGet(() -> {
                    List<PortfolioPositionResponse> positions = getPositions(userKey, account.getId());
                    PortfolioSummaryResponse summary = portfolioCalculationService.calculateSummary(Optional.of(account), positions);
                    List<PortfolioTransactionResponse> recentTransactions = portfolioTransactionService
                            .searchTransactions(
                                    userKey,
                                    new PortfolioTransactionSearchCondition(userKey, account.getId(), null, null, null, null),
                                    PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt", "id"))
                            )
                            .getContent();
                    PortfolioDashboardResponse response = new PortfolioDashboardResponse(
                            PortfolioAccountResponse.from(account),
                            summary,
                            positions,
                            recentTransactions
                    );
                    cacheService.put(dashboardCacheKey(userKey, account.getId()), response, cacheProperties.ttl());
                    return response;
                });
    }

    public PortfolioSummaryResponse getSummary(String userKey, Long portfolioId) {
        PortfolioAccount account = getAccount(userKey, portfolioId);
        return cacheService.get(summaryCacheKey(userKey, account.getId()), PortfolioSummaryResponse.class)
                .orElseGet(() -> {
                    PortfolioSummaryResponse summary = portfolioCalculationService.calculateSummary(
                            Optional.of(account),
                            getPositions(userKey, account.getId())
                    );
                    cacheService.put(summaryCacheKey(userKey, account.getId()), summary, cacheProperties.ttl());
                    return summary;
                });
    }

    public List<PortfolioPositionResponse> getPositions(String userKey, Long portfolioId) {
        PortfolioAccount account = getAccount(userKey, portfolioId);
        return cacheService.get(positionsCacheKey(userKey, account.getId()), new TypeReference<List<PortfolioPositionResponse>>() {
                })
                .orElseGet(() -> {
                    List<PortfolioPositionResponse> positions = portfolioCalculationService.calculatePositions(account);
                    cacheService.put(positionsCacheKey(userKey, account.getId()), positions, cacheProperties.ttl());
                    return positions;
                });
    }

    public PortfolioPositionResponse getPosition(String userKey, Long portfolioId, String normalizedCurUnit) {
        return getPositions(userKey, portfolioId).stream()
                .filter(position -> position.normalizedCurUnit().equals(normalizedCurUnit))
                .findFirst()
                .orElseThrow(() -> new DataNotFoundException("Portfolio position not found."));
    }

    public PortfolioAccount getAccount(String userKey, Long portfolioId) {
        return findAccount(userKey, portfolioId)
                .orElseThrow(() -> new DataNotFoundException("Portfolio account not found."));
    }

    public static String dashboardCacheKey(String userKey, Long portfolioId) {
        return "portfolio:dashboard:v7:%s:%d".formatted(userKey, portfolioId);
    }

    public static String summaryCacheKey(String userKey, Long portfolioId) {
        return "portfolio:summary:v7:%s:%d".formatted(userKey, portfolioId);
    }

    public static String positionsCacheKey(String userKey, Long portfolioId) {
        return "portfolio:positions:v7:%s:%d".formatted(userKey, portfolioId);
    }

    public static void evictPortfolioCaches(CacheService cacheService, String userKey, Long portfolioId) {
        cacheService.evict(dashboardCacheKey(userKey, portfolioId));
        cacheService.evict(summaryCacheKey(userKey, portfolioId));
        cacheService.evict(positionsCacheKey(userKey, portfolioId));
    }

    private void evictPortfolioCaches(String userKey, Long portfolioId) {
        evictPortfolioCaches(cacheService, userKey, portfolioId);
    }

    private PortfolioDashboardResponse emptyDashboard() {
        PortfolioSummaryResponse summary = portfolioCalculationService.calculateSummary(Optional.empty(), List.of());
        return new PortfolioDashboardResponse(null, summary, List.of(), List.of());
    }

    private void validateSupportedInvestmentCurrency(String investmentCurrency) {
        if (KRW.equals(investmentCurrency)) {
            return;
        }
        exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc(investmentCurrency)
                .orElseThrow(() -> new DataNotFoundException("Investment currency is not supported by stored exchange-rate data."));
    }
}
