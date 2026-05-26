package com.leo.exchange.exchange_rate.service;

import com.leo.exchange.exchange_rate.cache.CacheService;
import com.leo.exchange.exchange_rate.dto.PortfolioBuyRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioDepositRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioSellRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioTransactionResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioTransactionSearchCondition;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.entity.PortfolioAccount;
import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import com.leo.exchange.exchange_rate.exception.DataNotFoundException;
import com.leo.exchange.exchange_rate.exception.ExternalApiDailyLimitExceededException;
import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioAccountRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioTransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioTransactionService {

    private static final int SCALE = 12;
    private static final String KRW = "KRW";
    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final int BUY_RATE_LOOKBACK_DAYS = 10;

    private final PortfolioTransactionRepository portfolioTransactionRepository;
    private final PortfolioAccountRepository portfolioAccountRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final ExchangeRateSyncService exchangeRateSyncService;
    private final CurrencyUnitService currencyUnitService;
    private final PortfolioCalculationService portfolioCalculationService;
    private final CacheService cacheService;

    public Page<PortfolioTransactionResponse> searchTransactions(
            String userKey,
            PortfolioTransactionSearchCondition condition,
            Pageable pageable
    ) {
        PortfolioAccount account = findAccount(userKey, condition.portfolioId()).orElse(null);
        if (account == null) {
            return Page.empty(pageable);
        }
        PortfolioTransactionSearchCondition normalizedCondition = new PortfolioTransactionSearchCondition(
                userKey,
                account.getId(),
                condition.normalizedCurUnit(),
                condition.transactionType(),
                condition.fromDate(),
                condition.toDate()
        );
        Map<String, String> currencyNames = latestCurrencyNames(account.getInvestmentCurrency());
        return portfolioTransactionRepository.searchTransactions(normalizedCondition, pageable)
                .map(transaction -> toResponse(transaction, currencyNames));
    }

    @Transactional
    public PortfolioAccount deposit(String userKey, PortfolioDepositRequest request) {
        PortfolioAccount account = getAccount(userKey, request.portfolioId());
        account.deposit(request.amount());

        portfolioTransactionRepository.save(PortfolioTransaction.builder()
                .userKey(userKey)
                .portfolioId(account.getId())
                .curUnit(account.getInvestmentCurrency())
                .normalizedCurUnit(account.getInvestmentCurrency())
                .transactionType(PortfolioTransactionType.DEPOSIT)
                .transactionDate(LocalDate.now(SEOUL_ZONE))
                .foreignAmount(BigDecimal.ZERO)
                .exchangeRate(BigDecimal.ONE)
                .unitFactor(BigDecimal.ONE)
                .krwAmount(request.amount())
                .memo(request.memo())
                .build());
        evictPortfolioCaches(userKey, account.getId());
        return account;
    }

    @Transactional
    public PortfolioTransactionResponse buy(String userKey, PortfolioBuyRequest request) {
        PortfolioAccount account = getAccount(userKey, request.portfolioId());
        AppliedRate rate = rateForBuy(account, request.curUnit(), request.transactionDate());
        BigDecimal paymentAmount = calculatePaymentAmount(request.foreignAmount(), rate.exchangeRate(), rate.unitFactor());
        if (account.getCashBalance().compareTo(paymentAmount) < 0) {
            throw new InvalidRequestException("Cash balance is insufficient.");
        }

        // 투자 기준 통화 잔고를 사용해 선택 날짜 또는 직전 영업일 환율로 대상 통화를 매수한다.
        // Buys the target currency with investment-currency cash at the selected or previous business-day rate.
        account.decreaseCash(paymentAmount);
        PortfolioTransaction saved = portfolioTransactionRepository.save(PortfolioTransaction.builder()
                .userKey(userKey)
                .portfolioId(account.getId())
                .curUnit(rate.curUnit())
                .normalizedCurUnit(rate.normalizedCurUnit())
                .transactionType(PortfolioTransactionType.BUY)
                .transactionDate(rate.baseDate())
                .foreignAmount(request.foreignAmount())
                .exchangeRate(rate.exchangeRate())
                .unitFactor(rate.unitFactor())
                .krwAmount(paymentAmount)
                .memo(request.memo())
                .build());
        ensureLatestValuationRateStored(rate.normalizedCurUnit(), account.getInvestmentCurrency(), rate.baseDate());
        evictPortfolioCaches(userKey, account.getId());
        return toResponse(saved, rate.curName());
    }

    @Transactional
    public PortfolioTransactionResponse sell(String userKey, PortfolioSellRequest request) {
        PortfolioAccount account = getAccount(userKey, request.portfolioId());
        AppliedRate latestRate = latestRateForSell(account, request.curUnit());
        validateSellAmount(account.getId(), latestRate.normalizedCurUnit(), request.foreignAmount());
        BigDecimal proceedsAmount = calculatePaymentAmount(
                request.foreignAmount(),
                latestRate.exchangeRate(),
                latestRate.unitFactor()
        );

        // 최신 저장 환율만 사용해 대상 통화를 매도하고 투자 기준 통화 잔고를 증가시킨다.
        // Sells the target currency using only the latest stored rate and increases investment-currency cash.
        account.increaseCash(proceedsAmount);
        PortfolioTransaction saved = portfolioTransactionRepository.save(PortfolioTransaction.builder()
                .userKey(userKey)
                .portfolioId(account.getId())
                .curUnit(latestRate.curUnit())
                .normalizedCurUnit(latestRate.normalizedCurUnit())
                .transactionType(PortfolioTransactionType.SELL)
                .transactionDate(latestRate.baseDate())
                .foreignAmount(request.foreignAmount())
                .exchangeRate(latestRate.exchangeRate())
                .unitFactor(latestRate.unitFactor())
                .krwAmount(proceedsAmount)
                .memo(request.memo())
                .build());
        evictPortfolioCaches(userKey, account.getId());
        return toResponse(saved, latestRate.curName());
    }

    @Transactional
    public void deleteTransaction(String userKey, Long transactionId) {
        PortfolioTransaction transaction = portfolioTransactionRepository
                .findByIdAndUserKey(transactionId, userKey)
                .orElseThrow(() -> new DataNotFoundException("Portfolio transaction not found."));
        PortfolioAccount account = portfolioAccountRepository.findByIdAndUserKey(transaction.getPortfolioId(), userKey)
                .orElseThrow(() -> new DataNotFoundException("Portfolio account not found."));
        portfolioTransactionRepository.delete(transaction);
        rebuildAccount(account);
        evictPortfolioCaches(userKey, account.getId());
    }

    private PortfolioAccount getAccount(String userKey, Long portfolioId) {
        return findAccount(userKey, portfolioId)
                .orElseThrow(() -> new DataNotFoundException("Portfolio account not found."));
    }

    private java.util.Optional<PortfolioAccount> findAccount(String userKey, Long portfolioId) {
        if (portfolioId != null) {
            return portfolioAccountRepository.findByIdAndUserKey(portfolioId, userKey);
        }
        return portfolioAccountRepository.findFirstByUserKeyOrderByCreatedAtAscIdAsc(userKey);
    }

    private void rebuildAccount(PortfolioAccount account) {
        BigDecimal totalDeposited = BigDecimal.ZERO;
        BigDecimal cashBalance = BigDecimal.ZERO;
        for (PortfolioTransaction transaction : portfolioTransactionRepository
                .findByPortfolioIdOrderByTransactionDateAscIdAsc(account.getId())) {
            if (transaction.getTransactionType() == PortfolioTransactionType.DEPOSIT) {
                totalDeposited = totalDeposited.add(transaction.getKrwAmount());
                cashBalance = cashBalance.add(transaction.getKrwAmount());
            } else if (transaction.getTransactionType() == PortfolioTransactionType.BUY) {
                cashBalance = cashBalance.subtract(transaction.getKrwAmount());
            } else if (transaction.getTransactionType() == PortfolioTransactionType.SELL) {
                cashBalance = cashBalance.add(transaction.getKrwAmount());
            }
        }
        account.rebuild(cashBalance, totalDeposited);
    }

    private void validateSellAmount(Long portfolioId, String normalizedCurUnit, BigDecimal sellAmount) {
        BigDecimal holdingAmount = portfolioCalculationService.calculateHoldingAmount(portfolioId, normalizedCurUnit);
        if (holdingAmount.compareTo(sellAmount) < 0) {
            throw new InvalidRequestException("Sell amount cannot exceed the current holding amount.");
        }
    }

    private AppliedRate rateForBuy(PortfolioAccount account, String curUnit, LocalDate transactionDate) {
        String targetNormalized = currencyUnitService.normalize(curUnit);
        validateTargetCurrency(account, targetNormalized);
        RatePair rates = findRatePairOrSync(targetNormalized, account.getInvestmentCurrency(), transactionDate);
        return crossRate(rates.targetRate(), rates.investmentRate());
    }

    private AppliedRate latestRateForSell(PortfolioAccount account, String curUnit) {
        String targetNormalized = currencyUnitService.normalize(curUnit);
        validateTargetCurrency(account, targetNormalized);
        ExchangeRate latestTargetRate = latestStoredRate(targetNormalized, account.getInvestmentCurrency());
        RateBasis investmentRate = findInvestmentRateFromDb(account.getInvestmentCurrency(), latestTargetRate.getBaseDate());
        return crossRate(latestTargetRate, investmentRate);
    }

    private void validateTargetCurrency(PortfolioAccount account, String targetNormalized) {
        if (account.getInvestmentCurrency().equals(targetNormalized)) {
            throw new InvalidRequestException("Target currency must be different from the investment currency.");
        }
    }

    private RatePair findRatePairOrSync(String targetNormalized, String investmentCurrency, LocalDate requestedDate) {
        for (LocalDate candidateDate : candidateBusinessDates(requestedDate)) {
            ExchangeRate targetRate = findRateFromDb(targetNormalized, candidateDate).orElse(null);
            RateBasis investmentRate = findInvestmentRateFromDbOptional(investmentCurrency, candidateDate).orElse(null);
            if (targetRate != null && investmentRate != null) {
                return new RatePair(targetRate, investmentRate);
            }

            // 매수 날짜 또는 직전 영업일 환율이 DB에 없으면 해당 날짜를 한 번 동기화한 뒤 다시 조회한다.
            // If a buy-date or previous business-day rate is missing in DB, synchronizes that date once and retries.
            exchangeRateSyncService.sync(candidateDate, false, ExternalApiCallerType.PORTFOLIO);
            targetRate = findRateFromDb(targetNormalized, candidateDate).orElse(null);
            investmentRate = findInvestmentRateFromDbOptional(investmentCurrency, candidateDate).orElse(null);
            if (targetRate != null && investmentRate != null) {
                return new RatePair(targetRate, investmentRate);
            }
        }

        throw new DataNotFoundException("Exchange rate not found for the selected date or previous business days.");
    }

    private void ensureLatestValuationRateStored(
            String targetNormalized,
            String investmentCurrency,
            LocalDate buyBaseDate
    ) {
        for (LocalDate candidateDate : candidateBusinessDates(LocalDate.now(SEOUL_ZONE))) {
            if (candidateDate.isBefore(buyBaseDate)) {
                return;
            }
            if (hasRatePair(targetNormalized, investmentCurrency, candidateDate)) {
                return;
            }
            try {
                // 첫 매수 직후 평가손익이 매수일 환율에 고정되지 않도록 최신 영업일 환율도 보강 저장한다.
                // Stores the latest business-day rates as well so first-buy valuation is not stuck on the buy date.
                exchangeRateSyncService.sync(candidateDate, false, ExternalApiCallerType.PORTFOLIO);
            } catch (ExternalApiDailyLimitExceededException exception) {
                return;
            } catch (RuntimeException ignored) {
                continue;
            }
            if (hasRatePair(targetNormalized, investmentCurrency, candidateDate)) {
                return;
            }
        }
    }

    private boolean hasRatePair(String targetNormalized, String investmentCurrency, LocalDate date) {
        return findRateFromDb(targetNormalized, date).isPresent()
                && findInvestmentRateFromDbOptional(investmentCurrency, date).isPresent();
    }

    private List<LocalDate> candidateBusinessDates(LocalDate requestedDate) {
        return IntStream.rangeClosed(0, BUY_RATE_LOOKBACK_DAYS)
                .mapToObj(requestedDate::minusDays)
                .filter(date -> date.getDayOfWeek() != DayOfWeek.SATURDAY)
                .filter(date -> date.getDayOfWeek() != DayOfWeek.SUNDAY)
                .toList();
    }

    private ExchangeRate latestStoredRate(String targetNormalized, String investmentCurrency) {
        if (KRW.equals(targetNormalized)) {
            LocalDate baseDate = KRW.equals(investmentCurrency)
                    ? LocalDate.now(SEOUL_ZONE)
                    : exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc(investmentCurrency)
                    .map(ExchangeRate::getBaseDate)
                    .orElseThrow(() -> new DataNotFoundException("Latest exchange rate not found."));
            return krwExchangeRate(baseDate);
        }
        return exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc(targetNormalized)
                .orElseThrow(() -> new DataNotFoundException("Latest exchange rate not found."));
    }

    private java.util.Optional<ExchangeRate> findRateFromDb(String normalizedCurUnit, LocalDate date) {
        if (KRW.equals(normalizedCurUnit)) {
            return java.util.Optional.of(krwExchangeRate(date));
        }
        return exchangeRateRepository.findByNormalizedCurUnitAndBaseDate(normalizedCurUnit, date);
    }

    private RateBasis findInvestmentRateFromDb(String investmentCurrency, LocalDate date) {
        return findInvestmentRateFromDbOptional(investmentCurrency, date)
                .orElseThrow(() -> new DataNotFoundException("Investment currency exchange rate not found."));
    }

    private java.util.Optional<RateBasis> findInvestmentRateFromDbOptional(String investmentCurrency, LocalDate date) {
        if (KRW.equals(investmentCurrency)) {
            return java.util.Optional.of(new RateBasis(KRW, BigDecimal.ONE, BigDecimal.ONE));
        }
        return exchangeRateRepository.findByNormalizedCurUnitAndBaseDate(investmentCurrency, date)
                .map(rate -> new RateBasis(
                        rate.getNormalizedCurUnit(),
                        rate.getDealBasR(),
                        currencyUnitService.getUnitFactor(rate.getCurUnit())
                ));
    }

    private AppliedRate crossRate(ExchangeRate targetRate, RateBasis investmentRate) {
        BigDecimal targetUnitFactor = currencyUnitService.getUnitFactor(targetRate.getCurUnit());
        BigDecimal exchangeRateInInvestmentCurrency = targetRate.getDealBasR()
                .multiply(investmentRate.unitFactor())
                .divide(investmentRate.dealBasR(), SCALE, RoundingMode.HALF_UP);
        return new AppliedRate(
                targetRate.getCurUnit(),
                targetRate.getNormalizedCurUnit(),
                targetRate.getCurName(),
                targetRate.getBaseDate(),
                exchangeRateInInvestmentCurrency,
                targetUnitFactor
        );
    }

    private ExchangeRate krwExchangeRate(LocalDate baseDate) {
        return ExchangeRate.builder()
                .curUnit(KRW)
                .normalizedCurUnit(KRW)
                .curName("Korean Won")
                .dealBasR(BigDecimal.ONE)
                .baseDate(baseDate)
                .build();
    }

    private BigDecimal calculatePaymentAmount(BigDecimal foreignAmount, BigDecimal exchangeRate, BigDecimal unitFactor) {
        return foreignAmount.multiply(exchangeRate).divide(unitFactor, SCALE, RoundingMode.HALF_UP);
    }

    private PortfolioTransactionResponse toResponse(PortfolioTransaction transaction, Map<String, String> currencyNames) {
        return toResponse(
                transaction,
                currencyNames.getOrDefault(transaction.getNormalizedCurUnit(), transaction.getNormalizedCurUnit())
        );
    }

    private PortfolioTransactionResponse toResponse(PortfolioTransaction transaction, String curName) {
        return PortfolioTransactionResponse.from(transaction, curName);
    }

    private Map<String, String> latestCurrencyNames(String investmentCurrency) {
        Map<String, String> names = exchangeRateRepository.findAll().stream()
                .filter(rate -> Objects.nonNull(rate.getNormalizedCurUnit()))
                .collect(Collectors.toMap(
                        ExchangeRate::getNormalizedCurUnit,
                        ExchangeRate::getCurName,
                        (left, right) -> left
                ));
        names.put(KRW, "Korean Won");
        names.put(investmentCurrency, investmentCurrency + " Cash");
        return names;
    }

    private void evictPortfolioCaches(String userKey, Long portfolioId) {
        PortfolioService.evictPortfolioCaches(cacheService, userKey, portfolioId);
    }

    private record AppliedRate(
            String curUnit,
            String normalizedCurUnit,
            String curName,
            LocalDate baseDate,
            BigDecimal exchangeRate,
            BigDecimal unitFactor
    ) {
    }

    private record RateBasis(
            String normalizedCurUnit,
            BigDecimal dealBasR,
            BigDecimal unitFactor
    ) {
    }

    private record RatePair(
            ExchangeRate targetRate,
            RateBasis investmentRate
    ) {
    }
}
