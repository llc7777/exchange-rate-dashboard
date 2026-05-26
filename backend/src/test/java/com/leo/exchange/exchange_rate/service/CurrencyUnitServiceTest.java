package com.leo.exchange.exchange_rate.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CurrencyUnitServiceTest {

    private final CurrencyUnitService currencyUnitService = new CurrencyUnitService();

    @Test
    void normalizeHundredUnitCurrencies() {
        assertThat(currencyUnitService.normalize("JPY(100)")).isEqualTo("JPY");
        assertThat(currencyUnitService.normalize("IDR(100)")).isEqualTo("IDR");
        assertThat(currencyUnitService.normalize("USD")).isEqualTo("USD");
    }

    @Test
    void getUnitFactor() {
        assertThat(currencyUnitService.getUnitFactor("JPY(100)")).isEqualByComparingTo(BigDecimal.valueOf(100));
        assertThat(currencyUnitService.getUnitFactor("IDR(100)")).isEqualByComparingTo(BigDecimal.valueOf(100));
        assertThat(currencyUnitService.getUnitFactor("USD")).isEqualByComparingTo(BigDecimal.ONE);
    }
}
