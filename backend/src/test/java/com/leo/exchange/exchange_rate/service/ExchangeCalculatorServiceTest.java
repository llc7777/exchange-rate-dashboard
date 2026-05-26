package com.leo.exchange.exchange_rate.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.leo.exchange.exchange_rate.dto.ExchangeCalculateRequest;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.exception.DataNotFoundException;
import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExchangeCalculatorServiceTest {

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    private ExchangeCalculatorService exchangeCalculatorService;

    @BeforeEach
    void setUp() {
        exchangeCalculatorService = new ExchangeCalculatorService(exchangeRateRepository, new CurrencyUnitService());
    }

    @Test
    void calculateKrwToUsd() {
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD", "USD", "1350")));

        var response = exchangeCalculatorService.calculate(new ExchangeCalculateRequest(
                "KRW",
                "USD",
                new BigDecimal("135000")
        ));

        assertThat(response.convertedAmount()).isEqualByComparingTo("100");
        assertThat(response.appliedRate()).isEqualByComparingTo("0.0007407407");
    }

    @Test
    void calculateUsdToKrw() {
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD", "USD", "1350")));

        var response = exchangeCalculatorService.calculate(new ExchangeCalculateRequest(
                "USD",
                "KRW",
                new BigDecimal("100")
        ));

        assertThat(response.convertedAmount()).isEqualByComparingTo("135000");
        assertThat(response.appliedRate()).isEqualByComparingTo("1350");
    }

    @Test
    void calculateUsdToJpy() {
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.of(rate("USD", "USD", "1350")));
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("JPY"))
                .thenReturn(Optional.of(rate("JPY(100)", "JPY", "900")));

        var response = exchangeCalculatorService.calculate(new ExchangeCalculateRequest(
                "USD",
                "JPY",
                new BigDecimal("100")
        ));

        assertThat(response.convertedAmount()).isEqualByComparingTo("15000");
        assertThat(response.appliedRate()).isEqualByComparingTo("150");
    }

    @Test
    void calculateJpyHundredUnitToKrw() {
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("JPY"))
                .thenReturn(Optional.of(rate("JPY(100)", "JPY", "900")));

        var response = exchangeCalculatorService.calculate(new ExchangeCalculateRequest(
                "JPY",
                "KRW",
                new BigDecimal("100")
        ));

        assertThat(response.convertedAmount()).isEqualByComparingTo("900");
        assertThat(response.appliedRate()).isEqualByComparingTo("9");
    }

    @Test
    void amountMustBeGreaterThanZero() {
        assertThatThrownBy(() -> exchangeCalculatorService.calculate(new ExchangeCalculateRequest(
                "USD",
                "KRW",
                BigDecimal.ZERO
        ))).isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void missingCurrencyThrowsNotFound() {
        when(exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc("USD"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> exchangeCalculatorService.calculate(new ExchangeCalculateRequest(
                "USD",
                "KRW",
                BigDecimal.ONE
        ))).isInstanceOf(DataNotFoundException.class);
    }

    @Test
    void calculatorHasNoExternalApiDependency() {
        verifyNoMoreInteractions(exchangeRateRepository);
        assertThat(ExchangeCalculatorService.class.getDeclaredFields())
                .noneMatch(field -> field.getType().getSimpleName().contains("ExchangeApiClient"));
    }

    private ExchangeRate rate(String curUnit, String normalizedCurUnit, String dealBasR) {
        return ExchangeRate.builder()
                .curUnit(curUnit)
                .normalizedCurUnit(normalizedCurUnit)
                .curName(normalizedCurUnit)
                .dealBasR(new BigDecimal(dealBasR))
                .baseDate(LocalDate.of(2026, 5, 24))
                .changeAmount(BigDecimal.ZERO)
                .changeRate(BigDecimal.ZERO)
                .build();
    }
}
