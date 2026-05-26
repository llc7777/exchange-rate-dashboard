package com.leo.exchange.exchange_rate.service;

import com.leo.exchange.exchange_rate.dto.PortfolioPositionResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioSummaryResponse;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.entity.PortfolioAccount;
import com.leo.exchange.exchange_rate.entity.PortfolioChangeStatus;
import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import com.leo.exchange.exchange_rate.exception.DataNotFoundException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioTransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioCalculationService {

    private static final int SCALE = 12;
    private static final String KRW = "KRW";

    private final PortfolioTransactionRepository portfolioTransactionRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyUnitService currencyUnitService;

    public List<PortfolioPositionResponse> calculatePositions(PortfolioAccount account) {
        Map<String, List<PortfolioTransaction>> transactionsByCurrency = portfolioTransactionRepository.findByPortfolioId(account.getId())
                .stream()
                .filter(transaction -> transaction.getTransactionType() != PortfolioTransactionType.DEPOSIT)
                .collect(Collectors.groupingBy(PortfolioTransaction::getNormalizedCurUnit));

        return transactionsByCurrency.entrySet().stream()
                .map(entry -> calculatePosition(account, entry.getKey(), entry.getValue()))
                .filter(position -> position.holdingForeignAmount().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(PortfolioPositionResponse::normalizedCurUnit))
                .toList();
    }

    public PortfolioSummaryResponse calculateSummary(
            Optional<PortfolioAccount> optionalAccount,
            List<PortfolioPositionResponse> positions
    ) {
        String investmentCurrency = optionalAccount.map(PortfolioAccount::getInvestmentCurrency).orElse(null);
        BigDecimal cashBalance = optionalAccount.map(PortfolioAccount::getCashBalance).orElse(BigDecimal.ZERO);
        BigDecimal totalDeposited = optionalAccount.map(PortfolioAccount::getTotalDeposited).orElse(BigDecimal.ZERO);
        BigDecimal investedCost = sum(positions.stream().map(PortfolioPositionResponse::investedCost).toList());
        BigDecimal currencyValue = sum(positions.stream().map(PortfolioPositionResponse::currentValue).toList());
        BigDecimal totalAssetValue = cashBalance.add(currencyValue);
        BigDecimal profitLoss = totalAssetValue.subtract(totalDeposited);
        BigDecimal profitLossRate = percentage(profitLoss, totalDeposited);
        LocalDate baseDate = positions.stream()
                .map(PortfolioPositionResponse::baseDate)
                .min(Comparator.naturalOrder())
                .orElse(null);

        return new PortfolioSummaryResponse(
                investmentCurrency,
                scale(cashBalance),
                scale(totalDeposited),
                scale(investedCost),
                scale(currencyValue),
                scale(totalAssetValue),
                scale(profitLoss),
                scale(profitLossRate),
                PortfolioChangeStatus.from(profitLoss),
                positions.size(),
                baseDate
        );
    }

    public BigDecimal calculateHoldingAmount(Long portfolioId, String normalizedCurUnit) {
        BigDecimal holding = BigDecimal.ZERO;
        for (PortfolioTransaction transaction : portfolioTransactionRepository
                .findByPortfolioIdAndNormalizedCurUnitOrderByTransactionDateAscIdAsc(portfolioId, normalizedCurUnit)) {
            if (transaction.getTransactionType() == PortfolioTransactionType.BUY) {
                holding = holding.add(transaction.getForeignAmount());
            } else if (transaction.getTransactionType() == PortfolioTransactionType.SELL) {
                holding = holding.subtract(transaction.getForeignAmount());
            }
        }
        return holding.max(BigDecimal.ZERO);
    }

    private PortfolioPositionResponse calculatePosition(
            PortfolioAccount account,
            String normalizedCurUnit,
            List<PortfolioTransaction> transactions
    ) {
        List<PortfolioTransaction> ordered = transactions.stream()
                .sorted(Comparator.comparing(PortfolioTransaction::getTransactionDate)
                        .thenComparing(PortfolioTransaction::getId))
                .toList();

        BigDecimal holding = BigDecimal.ZERO;
        BigDecimal investedCost = BigDecimal.ZERO;
        BigDecimal averageBuyRate = BigDecimal.ZERO;
        BigDecimal unitFactor = ordered.getFirst().getUnitFactor();

        for (PortfolioTransaction transaction : ordered) {
            if (transaction.getTransactionType() == PortfolioTransactionType.BUY) {
                holding = holding.add(transaction.getForeignAmount());
                investedCost = investedCost.add(transaction.getKrwAmount());
            } else if (holding.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal sellAmount = transaction.getForeignAmount().min(holding);
                BigDecimal investedReduction = sellAmount
                        .multiply(averageBuyRate)
                        .divide(unitFactor, SCALE, RoundingMode.HALF_UP);
                holding = holding.subtract(sellAmount);
                investedCost = investedCost.subtract(investedReduction).max(BigDecimal.ZERO);
            }

            averageBuyRate = holding.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : investedCost.multiply(unitFactor).divide(holding, SCALE, RoundingMode.HALF_UP);
        }

        AppliedRate latestRate = latestRate(account, normalizedCurUnit, ordered.getLast().getTransactionDate());
        BigDecimal currentValue = holding.multiply(latestRate.exchangeRate())
                .divide(unitFactor, SCALE, RoundingMode.HALF_UP);
        BigDecimal profitLoss = currentValue.subtract(investedCost);

        // 현재 환율 기준으로 보유 통화의 평가금액을 투자 기준 통화로 계산한다.
        // Calculates the valuation of the held currency in the account investment currency.
        return new PortfolioPositionResponse(
                account.getInvestmentCurrency(),
                latestRate.curUnit(),
                latestRate.normalizedCurUnit(),
                latestRate.curName(),
                scale(holding),
                scale(averageBuyRate),
                scale(investedCost),
                scale(latestRate.exchangeRate()),
                scale(currentValue),
                scale(profitLoss),
                scale(percentage(profitLoss, investedCost)),
                PortfolioChangeStatus.from(profitLoss),
                latestRate.baseDate()
        );
    }

    private AppliedRate latestRate(PortfolioAccount account, String normalizedCurUnit, LocalDate fallbackDate) {
        String investmentCurrency = account.getInvestmentCurrency();
        ExchangeRate targetRate = latestStoredRate(normalizedCurUnit, investmentCurrency, fallbackDate);
        BigDecimal targetUnitFactor = currencyUnitService.getUnitFactor(targetRate.getCurUnit());

        if (investmentCurrency.equals(normalizedCurUnit)) {
            return new AppliedRate(
                    targetRate.getCurUnit(),
                    targetRate.getNormalizedCurUnit(),
                    targetRate.getCurName(),
                    targetRate.getBaseDate(),
                    BigDecimal.ONE,
                    targetUnitFactor
            );
        }

        BigDecimal exchangeRateInInvestmentCurrency = targetRate.getDealBasR();
        if (!KRW.equals(investmentCurrency)) {
            ExchangeRate investmentRate = exchangeRateRepository
                    .findByNormalizedCurUnitAndBaseDate(investmentCurrency, targetRate.getBaseDate())
                    .or(() -> exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc(investmentCurrency))
                    .orElseThrow(() -> new DataNotFoundException("Investment currency exchange rate not found."));
            BigDecimal investmentUnitFactor = currencyUnitService.getUnitFactor(investmentRate.getCurUnit());
            exchangeRateInInvestmentCurrency = targetRate.getDealBasR()
                    .multiply(investmentUnitFactor)
                    .divide(investmentRate.getDealBasR(), SCALE, RoundingMode.HALF_UP);
        }

        return new AppliedRate(
                targetRate.getCurUnit(),
                targetRate.getNormalizedCurUnit(),
                targetRate.getCurName(),
                targetRate.getBaseDate(),
                exchangeRateInInvestmentCurrency,
                targetUnitFactor
        );
    }

    private ExchangeRate latestStoredRate(String normalizedCurUnit, String investmentCurrency, LocalDate fallbackDate) {
        if (KRW.equals(normalizedCurUnit)) {
            LocalDate latestBaseDate = KRW.equals(investmentCurrency)
                    ? exchangeRateRepository.findLatestDate().orElse(fallbackDate)
                    : exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc(investmentCurrency)
                    .map(ExchangeRate::getBaseDate)
                    .orElseThrow(() -> new DataNotFoundException("Investment currency exchange rate not found."));
            return ExchangeRate.builder()
                    .curUnit(KRW)
                    .normalizedCurUnit(KRW)
                    .curName("Korean Won")
                    .dealBasR(BigDecimal.ONE)
                    .baseDate(latestBaseDate)
                    .build();
        }
        return exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc(normalizedCurUnit)
                .orElseThrow(() -> new DataNotFoundException("Latest exchange rate not found."));
    }

    private BigDecimal percentage(BigDecimal amount, BigDecimal base) {
        if (base == null || base.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return amount.divide(base, SCALE, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
    }

    private BigDecimal sum(List<BigDecimal> values) {
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(SCALE, RoundingMode.HALF_UP);
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
}
