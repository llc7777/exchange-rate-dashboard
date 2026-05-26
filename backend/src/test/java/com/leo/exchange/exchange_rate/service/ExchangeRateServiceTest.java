package com.leo.exchange.exchange_rate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.leo.exchange.exchange_rate.cache.CacheService;
import com.leo.exchange.exchange_rate.config.ExchangeCacheProperties;
import com.leo.exchange.exchange_rate.dto.ExchangeRateResponse;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.entity.FavoriteCurrency;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.FavoriteCurrencyRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExchangeRateServiceTest {

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @Mock
    private FavoriteCurrencyRepository favoriteCurrencyRepository;

    @Mock
    private CacheService cacheService;

    @Mock
    private ExchangeRateSyncService exchangeRateSyncService;

    private ExchangeRateService exchangeRateService;

    @BeforeEach
    void setUp() {
        exchangeRateService = new ExchangeRateService(
                exchangeRateRepository,
                favoriteCurrencyRepository,
                new CurrencyUnitService(),
                cacheService,
                new ExchangeCacheProperties(Duration.ofHours(6)),
                exchangeRateSyncService
        );
    }

    @Test
    void getTodayRatesUsesTodayData() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        when(cacheService.get(eq("exchange:today:v3"), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(Optional.empty());
        when(exchangeRateRepository.existsByBaseDate(today)).thenReturn(true);
        when(exchangeRateRepository.searchLatestRates(null, today)).thenReturn(List.of(rate("USD", today, "1350")));
        when(favoriteCurrencyRepository.findByUserKey("demo-user")).thenReturn(List.of(favorite("USD")));

        List<ExchangeRateResponse> responses = exchangeRateService.getTodayRates("demo-user");

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().favorite()).isTrue();
    }

    @Test
    void fallbackToLatestDateWhenTodayDataDoesNotExist() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        LocalDate latest = LocalDate.of(2026, 5, 23);
        when(cacheService.get(eq("exchange:today:v3"), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(Optional.empty());
        when(exchangeRateRepository.existsByBaseDate(today)).thenReturn(false);
        when(exchangeRateRepository.findLatestDate()).thenReturn(Optional.of(latest));
        when(exchangeRateRepository.searchLatestRates(null, latest)).thenReturn(List.of(rate("USD", latest, "1350", "12.5", "0.94")));
        when(favoriteCurrencyRepository.findByUserKey("demo-user")).thenReturn(List.of());

        List<ExchangeRateResponse> responses = exchangeRateService.getTodayRates("demo-user");

        assertThat(responses.getFirst().baseDate()).isEqualTo(latest);
        assertThat(responses.getFirst().changeAmount()).isEqualByComparingTo("12.5");
        assertThat(responses.getFirst().changeRate()).isEqualByComparingTo("0.94");
    }

    @Test
    void searchUsesQueryDslRepository() {
        LocalDate latest = LocalDate.of(2026, 5, 23);
        when(exchangeRateRepository.existsByBaseDate(any())).thenReturn(false);
        when(exchangeRateRepository.findLatestDate()).thenReturn(Optional.of(latest));
        when(exchangeRateRepository.searchLatestRates("usd", latest)).thenReturn(List.of(rate("USD", latest, "1350")));
        when(favoriteCurrencyRepository.findByUserKey("demo-user")).thenReturn(List.of());

        List<ExchangeRateResponse> responses = exchangeRateService.search("usd", "demo-user");

        assertThat(responses).hasSize(1);
        verify(exchangeRateRepository).searchLatestRates("usd", latest);
    }

    @Test
    void getDetailByNormalizedCurrencyAndDate() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        when(cacheService.get("exchange:detail:JPY:2026-05-24", ExchangeRateResponse.class))
                .thenReturn(Optional.empty());
        when(exchangeRateRepository.findByNormalizedCurUnitAndBaseDate("JPY", date))
                .thenReturn(Optional.of(rate("JPY(100)", date, "900")));
        when(favoriteCurrencyRepository.existsByUserKeyAndNormalizedCurUnit("demo-user", "JPY")).thenReturn(true);

        ExchangeRateResponse response = exchangeRateService.getDetail("JPY", date, "demo-user");

        assertThat(response.curUnit()).isEqualTo("JPY(100)");
        assertThat(response.favorite()).isTrue();
    }

    @Test
    void historyReturnsLatestSevenOrLessInAscendingOrder() {
        when(cacheService.get(eq("exchange:history:USD:7"), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(Optional.empty());
        when(exchangeRateRepository.findLatestHistory("USD", 7)).thenReturn(List.of(
                rate("USD", LocalDate.of(2026, 5, 24), "1350"),
                rate("USD", LocalDate.of(2026, 5, 22), "1340"),
                rate("USD", LocalDate.of(2026, 5, 23), "1345")
        ));

        var history = exchangeRateService.getHistory("USD");

        assertThat(history).hasSize(3);
        assertThat(history).extracting(item -> item.baseDate()).containsExactly(
                LocalDate.of(2026, 5, 22),
                LocalDate.of(2026, 5, 23),
                LocalDate.of(2026, 5, 24)
        );
    }

    @Test
    void cachedTodayDataIsReturnedWithoutDbRateQuery() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        when(cacheService.get(eq("exchange:today:v3"), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(Optional.of(List.of(ExchangeRateResponse.from(rate("USD", date, "1350"), false))));
        when(favoriteCurrencyRepository.findByUserKey("demo-user")).thenReturn(List.of());

        List<ExchangeRateResponse> responses = exchangeRateService.getTodayRates("demo-user");

        assertThat(responses).hasSize(1);
        verify(exchangeRateRepository, never()).searchLatestRates(any(), any());
    }

    @Test
    void userReadServiceHasNoExternalApiClientDependency() {
        assertThat(ExchangeRateService.class.getDeclaredFields())
                .noneMatch(field -> field.getType().getSimpleName().contains("ExchangeApiClient"));
    }

    @Test
    void latestKrwRateUsesLatestStoredBusinessDate() {
        LocalDate latestBusinessDate = LocalDate.of(2026, 5, 22);
        when(exchangeRateRepository.findLatestDate()).thenReturn(Optional.of(latestBusinessDate));

        var response = exchangeRateService.getLatestRateForTransaction("KRW");

        assertThat(response.baseDate()).isEqualTo(latestBusinessDate);
        assertThat(response.dealBasR()).isEqualByComparingTo("1");
    }

    private ExchangeRate rate(String curUnit, LocalDate date, String dealBasR) {
        return rate(curUnit, date, dealBasR, "0", "0");
    }

    private ExchangeRate rate(String curUnit, LocalDate date, String dealBasR, String changeAmount, String changeRate) {
        String normalized = curUnit.contains("(") ? curUnit.substring(0, curUnit.indexOf('(')) : curUnit;
        return ExchangeRate.builder()
                .id(1L)
                .curUnit(curUnit)
                .normalizedCurUnit(normalized)
                .curName(normalized + " name")
                .dealBasR(new BigDecimal(dealBasR))
                .baseDate(date)
                .changeAmount(new BigDecimal(changeAmount))
                .changeRate(new BigDecimal(changeRate))
                .build();
    }

    private FavoriteCurrency favorite(String normalizedCurUnit) {
        return FavoriteCurrency.builder()
                .userKey("demo-user")
                .curUnit(normalizedCurUnit)
                .normalizedCurUnit(normalizedCurUnit)
                .build();
    }
}
