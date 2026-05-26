package com.leo.exchange.exchange_rate.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.leo.exchange.exchange_rate.client.ExchangeApiClient;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.FavoriteCurrencyRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

class ExchangeRateControllerIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExchangeRateRepository exchangeRateRepository;

    @Autowired
    private FavoriteCurrencyRepository favoriteCurrencyRepository;

    @MockitoBean
    private ExchangeApiClient exchangeApiClient;

    @BeforeEach
    void setUp() {
        favoriteCurrencyRepository.deleteAll();
        exchangeRateRepository.deleteAll();
    }

    @Test
    void getTodayRates() throws Exception {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        exchangeRateRepository.save(rate("USD", today, "1350"));

        mockMvc.perform(get("/api/exchange-rates/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].curUnit").value("USD"));

        verify(exchangeApiClient, never()).fetchExchangeRates(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void searchRates() throws Exception {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        exchangeRateRepository.save(rate("USD", today, "1350"));

        mockMvc.perform(get("/api/exchange-rates/search").param("keyword", "usd"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].normalizedCurUnit").value("USD"));
    }

    @Test
    void getDetail() throws Exception {
        LocalDate date = LocalDate.of(2026, 5, 24);
        exchangeRateRepository.save(rate("JPY(100)", date, "900"));

        mockMvc.perform(get("/api/exchange-rates/JPY").param("date", "2026-05-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.curUnit").value("JPY(100)"))
                .andExpect(jsonPath("$.dealBasR").value(900));
    }

    @Test
    void getRateForTransactionDate() throws Exception {
        LocalDate date = LocalDate.of(2026, 5, 24);
        exchangeRateRepository.save(rate("JPY(100)", date, "900"));

        mockMvc.perform(get("/api/exchange-rates/JPY/rate").param("date", "2026-05-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.curUnit").value("JPY(100)"))
                .andExpect(jsonPath("$.dealBasR").value(900))
                .andExpect(jsonPath("$.unitFactor").value(100));
    }

    @Test
    void historyReturnsLatestSevenAscendingAndNeverCallsExternalApi() throws Exception {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        for (int i = 0; i < 10; i++) {
            exchangeRateRepository.save(rate("USD", today.minusDays(i), String.valueOf(1300 + i)));
        }

        mockMvc.perform(get("/api/exchange-rates/USD/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(7)))
                .andExpect(jsonPath("$[0].baseDate").value(today.minusDays(6).toString()))
                .andExpect(jsonPath("$[6].baseDate").value(today.toString()));

        verify(exchangeApiClient, never()).fetchExchangeRates(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void historyRejectsDaysQueryParameter() throws Exception {
        mockMvc.perform(get("/api/exchange-rates/USD/history").param("days", "10"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void historyReturnsOnlyExistingRowsWhenLessThanSeven() throws Exception {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        for (int i = 0; i < 3; i++) {
            exchangeRateRepository.save(rate("JPY(100)", today.minusDays(i), String.valueOf(900 + i)));
        }

        mockMvc.perform(get("/api/exchange-rates/JPY/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].baseDate").value(today.minusDays(2).toString()))
                .andExpect(jsonPath("$[2].baseDate").value(today.toString()));
    }

    @Test
    void calculateRates() throws Exception {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        exchangeRateRepository.save(rate("USD", today, "1350"));

        mockMvc.perform(post("/api/exchange-rates/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fromCurrency": "USD",
                                  "toCurrency": "KRW",
                                  "amount": 100
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.convertedAmount").value(135000));
    }
}
