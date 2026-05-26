package com.leo.exchange.exchange_rate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.entity.PortfolioAccount;
import com.leo.exchange.exchange_rate.entity.PortfolioChangeStatus;
import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PortfolioCalculationServiceTest {

    @Mock
    private PortfolioTransactionRepository transactionRepository;

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    private PortfolioCalculationService calculationService;

    @BeforeEach
    void setUp() {
        calculationService = new PortfolioCalculationService(
                transactionRepository,
                exchangeRateRepository,
                new CurrencyUnitService()
        );
    }

    @Test
    void calculatesHoldingAndProfitForBuyAndSell() {
        when(transactionRepository.findByPortfolioId(10L)).thenReturn(List.of(
                transaction(1L, "USD", PortfolioTransactionType.BUY, "100", "1300", "1"),
                transaction(2L, "USD", PortfolioTransactionType.SELL, "40", "1350", "1")
        ));
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD", "USD", "1400")));

        var positions = calculationService.calculatePositions(account());

        assertThat(positions).hasSize(1);
        var position = positions.getFirst();
        assertThat(position.holdingForeignAmount()).isEqualByComparingTo("60");
        assertThat(position.averageBuyRate()).isEqualByComparingTo("1300");
        assertThat(position.currentValue()).isEqualByComparingTo("84000");
        assertThat(position.profitLoss()).isEqualByComparingTo("6000");
        assertThat(position.changeStatus()).isEqualTo(PortfolioChangeStatus.UP);
    }

    @Test
    void calculatesJpyHundredUnitFactor() {
        when(transactionRepository.findByPortfolioId(10L)).thenReturn(List.of(
                transaction(1L, "JPY(100)", PortfolioTransactionType.BUY, "10000", "900", "100")
        ));
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("JPY"))
                .thenReturn(Optional.of(rate("JPY(100)", "JPY", "950")));

        var position = calculationService.calculatePositions(account()).getFirst();

        assertThat(position.investedCost()).isEqualByComparingTo("90000");
        assertThat(position.currentValue()).isEqualByComparingTo("95000");
        assertThat(position.profitLossRate()).isEqualByComparingTo("5.555555555600");
    }

    @Test
    void valuesKrwPositionWithLatestInvestmentCurrencyBusinessDate() {
        when(transactionRepository.findByPortfolioId(10L)).thenReturn(List.of(
                PortfolioTransaction.builder()
                        .id(1L)
                        .userKey("demo-user")
                        .portfolioId(10L)
                        .curUnit("KRW")
                        .normalizedCurUnit("KRW")
                        .transactionType(PortfolioTransactionType.BUY)
                        .transactionDate(LocalDate.of(2026, 5, 6))
                        .foreignAmount(new BigDecimal("1470"))
                        .exchangeRate(new BigDecimal("0.000680272"))
                        .unitFactor(BigDecimal.ONE)
                        .krwAmount(new BigDecimal("1"))
                        .build()
        ));
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD", "USD", "1503.5", LocalDate.of(2026, 5, 22))));

        var position = calculationService.calculatePositions(account("USD")).getFirst();

        assertThat(position.baseDate()).isEqualTo(LocalDate.of(2026, 5, 22));
        assertThat(position.currentValue()).isEqualByComparingTo("0.977718656040");
        assertThat(position.changeStatus()).isEqualTo(PortfolioChangeStatus.DOWN);
    }

    private PortfolioTransaction transaction(
            Long id,
            String curUnit,
            PortfolioTransactionType type,
            String amount,
            String exchangeRate,
            String unitFactor
    ) {
        String normalizedCurUnit = curUnit.contains("(") ? curUnit.substring(0, curUnit.indexOf("(")) : curUnit;
        BigDecimal amountValue = new BigDecimal(amount);
        BigDecimal rateValue = new BigDecimal(exchangeRate);
        BigDecimal factorValue = new BigDecimal(unitFactor);
        return PortfolioTransaction.builder()
                .id(id)
                .userKey("demo-user")
                .portfolioId(10L)
                .curUnit(curUnit)
                .normalizedCurUnit(normalizedCurUnit)
                .transactionType(type)
                .transactionDate(LocalDate.of(2026, 5, 22))
                .foreignAmount(amountValue)
                .exchangeRate(rateValue)
                .unitFactor(factorValue)
                .krwAmount(amountValue.multiply(rateValue).divide(factorValue))
                .build();
    }

    private PortfolioAccount account() {
        return account("KRW");
    }

    private PortfolioAccount account(String investmentCurrency) {
        return PortfolioAccount.builder()
                .id(10L)
                .userKey("demo-user")
                .investmentCurrency(investmentCurrency)
                .cashBalance(BigDecimal.ZERO)
                .totalDeposited(BigDecimal.ZERO)
                .build();
    }

    private ExchangeRate rate(String curUnit, String normalizedCurUnit, String dealBasR) {
        return rate(curUnit, normalizedCurUnit, dealBasR, LocalDate.of(2026, 5, 24));
    }

    private ExchangeRate rate(String curUnit, String normalizedCurUnit, String dealBasR, LocalDate baseDate) {
        return ExchangeRate.builder()
                .curUnit(curUnit)
                .normalizedCurUnit(normalizedCurUnit)
                .curName(normalizedCurUnit)
                .dealBasR(new BigDecimal(dealBasR))
                .baseDate(baseDate)
                .build();
    }
}
