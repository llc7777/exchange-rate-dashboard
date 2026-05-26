package com.leo.exchange.exchange_rate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.leo.exchange.exchange_rate.cache.CacheService;
import com.leo.exchange.exchange_rate.client.ExchangeApiClient;
import com.leo.exchange.exchange_rate.dto.ExchangeApiRateItem;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.exception.ExternalApiDailyLimitExceededException;
import com.leo.exchange.exchange_rate.exception.ExternalApiException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExchangeRateSyncServiceTest {

    @Mock
    private ExchangeApiClient exchangeApiClient;

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @Mock
    private CacheService cacheService;

    private ExchangeRateSyncService syncService;

    @BeforeEach
    void setUp() {
        syncService = new ExchangeRateSyncService(
                exchangeApiClient,
                exchangeRateRepository,
                new CurrencyUnitService(),
                cacheService,
                new ExternalApiGuardService()
        );
    }

    @Test
    void parseCommaNumberToBigDecimal() {
        assertThat(syncService.parseApiNumber("1,358.20")).isEqualByComparingTo("1358.20");
    }

    @Test
    void saveNewData() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        when(exchangeRateRepository.existsByBaseDate(date)).thenReturn(false);
        when(exchangeApiClient.fetchExchangeRates(date)).thenReturn(List.of(item("USD", "1350.00")));
        when(exchangeRateRepository.findByCurUnitAndBaseDate("USD", date)).thenReturn(Optional.empty());
        when(exchangeRateRepository.findTopByNormalizedCurUnitAndBaseDateBeforeOrderByBaseDateDesc("USD", date))
                .thenReturn(Optional.empty());

        var response = syncService.sync(date, false, ExternalApiCallerType.ADMIN);

        ArgumentCaptor<List<ExchangeRate>> captor = ArgumentCaptor.forClass(List.class);
        verify(exchangeRateRepository).saveAll(captor.capture());
        assertThat(response.savedCount()).isEqualTo(1);
        assertThat(captor.getValue().getFirst().getDealBasR()).isEqualByComparingTo("1350.00");
    }

    @Test
    void skipWhenDataExistsAndForceFalse() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        when(exchangeRateRepository.existsByBaseDate(date)).thenReturn(true);

        var response = syncService.sync(date, false, ExternalApiCallerType.ADMIN);

        assertThat(response.skipped()).isTrue();
        verify(exchangeApiClient, never()).fetchExchangeRates(any());
    }

    @Test
    void forceTrueCallsExternalApiAndUpdatesExistingRate() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        ExchangeRate existing = rate("USD", "USD", "1300");
        when(exchangeApiClient.fetchExchangeRates(date)).thenReturn(List.of(item("USD", "1350.00")));
        when(exchangeRateRepository.findByCurUnitAndBaseDate("USD", date)).thenReturn(Optional.of(existing));
        when(exchangeRateRepository.findTopByNormalizedCurUnitAndBaseDateBeforeOrderByBaseDateDesc("USD", date))
                .thenReturn(Optional.empty());

        syncService.sync(date, true, ExternalApiCallerType.ADMIN);

        assertThat(existing.getDealBasR()).isEqualByComparingTo("1350.00");
        verify(exchangeApiClient).fetchExchangeRates(date);
    }

    @Test
    void calculateChangeAmountAndRate() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        ExchangeRate previous = rate("USD", "USD", "1300");
        when(exchangeRateRepository.existsByBaseDate(date)).thenReturn(false);
        when(exchangeApiClient.fetchExchangeRates(date)).thenReturn(List.of(item("USD", "1350")));
        when(exchangeRateRepository.findByCurUnitAndBaseDate("USD", date)).thenReturn(Optional.empty());
        when(exchangeRateRepository.findTopByNormalizedCurUnitAndBaseDateBeforeOrderByBaseDateDesc("USD", date))
                .thenReturn(Optional.of(previous));

        syncService.sync(date, false, ExternalApiCallerType.ADMIN);

        ArgumentCaptor<List<ExchangeRate>> captor = ArgumentCaptor.forClass(List.class);
        verify(exchangeRateRepository).saveAll(captor.capture());
        ExchangeRate saved = captor.getValue().getFirst();
        assertThat(saved.getChangeAmount()).isEqualByComparingTo("50");
        assertThat(saved.getChangeRate()).isEqualByComparingTo("3.846200");
    }

    @Test
    void externalApiResultCodesThrowMeaningfulExceptions() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        when(exchangeApiClient.fetchExchangeRates(date)).thenReturn(List.of(resultOnly("2")));
        assertThatThrownBy(() -> syncService.sync(date, true, ExternalApiCallerType.ADMIN))
                .isInstanceOf(ExternalApiException.class);

        when(exchangeApiClient.fetchExchangeRates(date)).thenReturn(List.of(resultOnly("3")));
        assertThatThrownBy(() -> syncService.sync(date, true, ExternalApiCallerType.ADMIN))
                .isInstanceOf(ExternalApiException.class);
    }

    @Test
    void dailyLimitResultThrowsSpecificException() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        when(exchangeApiClient.fetchExchangeRates(date)).thenReturn(List.of(resultOnly("4")));

        assertThatThrownBy(() -> syncService.sync(date, true, ExternalApiCallerType.ADMIN))
                .isInstanceOf(ExternalApiDailyLimitExceededException.class);
    }

    @Test
    void cacheIsEvictedAfterSync() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        when(exchangeRateRepository.existsByBaseDate(date)).thenReturn(false);
        when(exchangeApiClient.fetchExchangeRates(date)).thenReturn(List.of(item("USD", "1350")));
        when(exchangeRateRepository.findByCurUnitAndBaseDate("USD", date)).thenReturn(Optional.empty());
        when(exchangeRateRepository.findTopByNormalizedCurUnitAndBaseDateBeforeOrderByBaseDateDesc("USD", date))
                .thenReturn(Optional.empty());

        syncService.sync(date, false, ExternalApiCallerType.ADMIN);

        verify(cacheService).evict("exchange:today:v3");
        verify(cacheService).evict("exchange:detail:USD:2026-05-24");
        verify(cacheService).evict("exchange:history:USD:7");
        verify(cacheService).evictByPattern("portfolio:*");
    }

    private ExchangeApiRateItem item(String curUnit, String dealBasR) {
        return new ExchangeApiRateItem("1", curUnit, "US Dollar", "1,340.00", "1,360.00", dealBasR,
                dealBasR, "0", "0", dealBasR, dealBasR);
    }

    private ExchangeApiRateItem resultOnly(String result) {
        return new ExchangeApiRateItem(result, null, null, null, null, null, null, null, null, null, null);
    }

    private ExchangeRate rate(String curUnit, String normalizedCurUnit, String dealBasR) {
        return ExchangeRate.builder()
                .curUnit(curUnit)
                .normalizedCurUnit(normalizedCurUnit)
                .curName(normalizedCurUnit)
                .dealBasR(new BigDecimal(dealBasR))
                .baseDate(LocalDate.of(2026, 5, 23))
                .changeAmount(BigDecimal.ZERO)
                .changeRate(BigDecimal.ZERO)
                .build();
    }
}
