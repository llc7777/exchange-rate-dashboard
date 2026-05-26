package com.leo.exchange.exchange_rate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.leo.exchange.exchange_rate.cache.CacheService;
import com.leo.exchange.exchange_rate.dto.PortfolioBuyRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioDepositRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioSellRequest;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.entity.PortfolioAccount;
import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioAccountRepository;
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
class PortfolioTransactionServiceTest {

    @Mock
    private PortfolioTransactionRepository transactionRepository;

    @Mock
    private PortfolioAccountRepository accountRepository;

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @Mock
    private ExchangeRateSyncService exchangeRateSyncService;

    @Mock
    private PortfolioCalculationService calculationService;

    @Mock
    private CacheService cacheService;

    private PortfolioTransactionService transactionService;

    @BeforeEach
    void setUp() {
        transactionService = new PortfolioTransactionService(
                transactionRepository,
                accountRepository,
                exchangeRateRepository,
                exchangeRateSyncService,
                new CurrencyUnitService(),
                calculationService,
                cacheService
        );
    }

    @Test
    void depositCreatesAccountAndIncreasesCashBalance() {
        PortfolioAccount account = account("demo-user", "0", "0");
        when(accountRepository.findByIdAndUserKey(10L, "demo-user")).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(PortfolioTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PortfolioAccount response = transactionService.deposit(
                "demo-user",
                new PortfolioDepositRequest(10L, new BigDecimal("1000000"), "initial deposit")
        );

        assertThat(response.getCashBalance()).isEqualByComparingTo("1000000");
        assertThat(response.getTotalDeposited()).isEqualByComparingTo("1000000");
        verify(cacheService).evict("portfolio:dashboard:v5:demo-user:10");
    }

    @Test
    void buyUsesStoredRateForSelectedDateAndDecreasesCashBalance() {
        LocalDate date = LocalDate.of(2026, 5, 20);
        PortfolioAccount account = account("demo-user", "1000000", "1000000");
        when(accountRepository.findByIdAndUserKey(10L, "demo-user")).thenReturn(Optional.of(account));
        when(exchangeRateRepository.findByNormalizedCurUnitAndBaseDate("USD", date))
                .thenReturn(Optional.of(rate("USD", "USD", "900", date)));
        when(transactionRepository.save(any(PortfolioTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = transactionService.buy(
                "demo-user",
                new PortfolioBuyRequest(10L, "USD", date, new BigDecimal("100"), "first buy")
        );

        assertThat(response.exchangeRate()).isEqualByComparingTo("900");
        assertThat(response.amount()).isEqualByComparingTo("90000");
        assertThat(response.transactionDate()).isEqualTo(date);
        assertThat(account.getCashBalance()).isEqualByComparingTo("910000");
    }

    @Test
    void buyFailsWhenCashBalanceIsInsufficient() {
        LocalDate date = LocalDate.of(2026, 5, 20);
        when(accountRepository.findByIdAndUserKey(10L, "demo-user"))
                .thenReturn(Optional.of(account("demo-user", "1000", "1000")));
        when(exchangeRateRepository.findByNormalizedCurUnitAndBaseDate("USD", date))
                .thenReturn(Optional.of(rate("USD", "USD", "900", date)));

        assertThatThrownBy(() -> transactionService.buy(
                "demo-user",
                new PortfolioBuyRequest(10L, "USD", date, new BigDecimal("100"), null)
        )).isInstanceOf(InvalidRequestException.class)
                .hasMessage("Cash balance is insufficient.");
    }

    @Test
    void sellUsesLatestStoredRateAndIncreasesCashBalance() {
        PortfolioAccount account = account("demo-user", "1000", "1000");
        LocalDate latestDate = LocalDate.of(2026, 5, 22);
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD", "USD", "1000", latestDate)));
        when(calculationService.calculateHoldingAmount(10L, "USD"))
                .thenReturn(new BigDecimal("100"));
        when(accountRepository.findByIdAndUserKey(10L, "demo-user")).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(PortfolioTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = transactionService.sell(
                "demo-user",
                new PortfolioSellRequest(10L, "USD", new BigDecimal("40"), "sell USD")
        );

        assertThat(response.exchangeRate()).isEqualByComparingTo("1000");
        assertThat(response.transactionDate()).isEqualTo(latestDate);
        assertThat(response.amount()).isEqualByComparingTo("40000");
        assertThat(account.getCashBalance()).isEqualByComparingTo("41000");
    }

    @Test
    void sellRejectsAmountGreaterThanCurrentHolding() {
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD", "USD", "1000", LocalDate.of(2026, 5, 22))));
        when(accountRepository.findByIdAndUserKey(10L, "demo-user"))
                .thenReturn(Optional.of(account("demo-user", "1000", "1000")));
        when(calculationService.calculateHoldingAmount(10L, "USD"))
                .thenReturn(new BigDecimal("50"));

        assertThatThrownBy(() -> transactionService.sell(
                "demo-user",
                new PortfolioSellRequest(10L, "USD", new BigDecimal("100"), null)
        )).isInstanceOf(InvalidRequestException.class)
                .hasMessage("Sell amount cannot exceed the current holding amount.");
    }

    @Test
    void deleteRebuildsAccountFromRemainingTransactions() {
        PortfolioTransaction deleted = transaction(1L, PortfolioTransactionType.BUY, "USD", "100", "900", "90000");
        PortfolioAccount account = account("demo-user", "100000", "100000");
        when(transactionRepository.findByIdAndUserKey(1L, "demo-user")).thenReturn(Optional.of(deleted));
        when(accountRepository.findByIdAndUserKey(10L, "demo-user")).thenReturn(Optional.of(account));
        when(transactionRepository.findByPortfolioIdOrderByTransactionDateAscIdAsc(10L)).thenReturn(List.of(
                depositTransaction(2L, "100000"),
                transaction(3L, PortfolioTransactionType.BUY, "USD", "50", "900", "45000"),
                transaction(4L, PortfolioTransactionType.SELL, "USD", "10", "1000", "10000")
        ));

        transactionService.deleteTransaction("demo-user", 1L);

        assertThat(account.getTotalDeposited()).isEqualByComparingTo("100000");
        assertThat(account.getCashBalance()).isEqualByComparingTo("65000");
    }

    private PortfolioAccount account(String userKey, String cash, String deposited) {
        return PortfolioAccount.builder()
                .id(10L)
                .userKey(userKey)
                .name("KRW Portfolio")
                .investmentCurrency("KRW")
                .cashBalance(new BigDecimal(cash))
                .totalDeposited(new BigDecimal(deposited))
                .build();
    }

    private PortfolioTransaction depositTransaction(Long id, String amount) {
        return PortfolioTransaction.builder()
                .id(id)
                .userKey("demo-user")
                .portfolioId(10L)
                .transactionType(PortfolioTransactionType.DEPOSIT)
                .transactionDate(LocalDate.of(2026, 5, 19))
                .krwAmount(new BigDecimal(amount))
                .build();
    }

    private PortfolioTransaction transaction(
            Long id,
            PortfolioTransactionType type,
            String curUnit,
            String foreignAmount,
            String exchangeRate,
            String krwAmount
    ) {
        return PortfolioTransaction.builder()
                .id(id)
                .userKey("demo-user")
                .portfolioId(10L)
                .curUnit(curUnit)
                .normalizedCurUnit(curUnit)
                .transactionType(type)
                .transactionDate(LocalDate.of(2026, 5, 20))
                .foreignAmount(new BigDecimal(foreignAmount))
                .exchangeRate(new BigDecimal(exchangeRate))
                .unitFactor(BigDecimal.ONE)
                .krwAmount(new BigDecimal(krwAmount))
                .build();
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
