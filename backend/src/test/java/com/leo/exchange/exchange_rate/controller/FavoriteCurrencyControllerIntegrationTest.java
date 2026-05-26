package com.leo.exchange.exchange_rate.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.FavoriteCurrencyRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

class FavoriteCurrencyControllerIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExchangeRateRepository exchangeRateRepository;

    @Autowired
    private FavoriteCurrencyRepository favoriteCurrencyRepository;

    @BeforeEach
    void setUp() {
        favoriteCurrencyRepository.deleteAll();
        exchangeRateRepository.deleteAll();
        exchangeRateRepository.save(rate("USD", LocalDate.of(2026, 5, 24), "1350"));
    }

    @Test
    void addGetAndDeleteFavorite() throws Exception {
        String authorization = authorizationHeader();

        mockMvc.perform(post("/api/favorites/USD").header("Authorization", authorization))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.normalizedCurUnit").value("USD"));

        mockMvc.perform(get("/api/favorites").header("Authorization", authorization))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(delete("/api/favorites/USD").header("Authorization", authorization))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/favorites").header("Authorization", authorization))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void favoritesRequireLogin() throws Exception {
        mockMvc.perform(get("/api/favorites"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Login is required."));
    }
}
