package com.leo.exchange.exchange_rate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.entity.FavoriteCurrency;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.FavoriteCurrencyRepository;
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
class FavoriteCurrencyServiceTest {

    @Mock
    private FavoriteCurrencyRepository favoriteCurrencyRepository;

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    private FavoriteCurrencyService favoriteCurrencyService;

    @BeforeEach
    void setUp() {
        favoriteCurrencyService = new FavoriteCurrencyService(
                favoriteCurrencyRepository,
                exchangeRateRepository,
                new CurrencyUnitService()
        );
    }

    @Test
    void addFavorite() {
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD")));
        when(favoriteCurrencyRepository.existsByUserKeyAndNormalizedCurUnit("demo-user", "USD")).thenReturn(false);

        var response = favoriteCurrencyService.addFavorite("demo-user", "usd");

        assertThat(response.normalizedCurUnit()).isEqualTo("USD");
        verify(favoriteCurrencyRepository).save(org.mockito.ArgumentMatchers.any(FavoriteCurrency.class));
    }

    @Test
    void duplicateFavoriteIsNotSavedAgain() {
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD")));
        when(favoriteCurrencyRepository.existsByUserKeyAndNormalizedCurUnit("demo-user", "USD")).thenReturn(true);

        favoriteCurrencyService.addFavorite("demo-user", "USD");

        verify(favoriteCurrencyRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void deleteFavorite() {
        favoriteCurrencyService.deleteFavorite("demo-user", "JPY");

        verify(favoriteCurrencyRepository).deleteByUserKeyAndNormalizedCurUnit("demo-user", "JPY");
    }

    @Test
    void getFavoriteListWithLatestRates() {
        when(favoriteCurrencyRepository.findByUserKeyOrderByCreatedAtAsc("demo-user"))
                .thenReturn(List.of(FavoriteCurrency.builder()
                        .userKey("demo-user")
                        .curUnit("USD")
                        .normalizedCurUnit("USD")
                        .build()));
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD")));

        var responses = favoriteCurrencyService.getFavorites("demo-user");

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().curUnit()).isEqualTo("USD");
    }

    private ExchangeRate rate(String curUnit) {
        return ExchangeRate.builder()
                .curUnit(curUnit)
                .normalizedCurUnit(curUnit)
                .curName(curUnit)
                .dealBasR(new BigDecimal("1350"))
                .baseDate(LocalDate.of(2026, 5, 24))
                .changeAmount(BigDecimal.ZERO)
                .changeRate(BigDecimal.ZERO)
                .build();
    }
}
