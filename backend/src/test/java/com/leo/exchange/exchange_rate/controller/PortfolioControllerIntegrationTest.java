package com.leo.exchange.exchange_rate.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioAccountRepository;
import com.leo.exchange.exchange_rate.repository.PortfolioTransactionRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

class PortfolioControllerIntegrationTest extends IntegrationTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ExchangeRateRepository exchangeRateRepository;

    @Autowired
    private PortfolioTransactionRepository portfolioTransactionRepository;

    @Autowired
    private PortfolioAccountRepository portfolioAccountRepository;

    @BeforeEach
    void setUp() {
        portfolioTransactionRepository.deleteAll();
        portfolioAccountRepository.deleteAll();
        exchangeRateRepository.deleteAll();
        exchangeRateRepository.save(rate("USD", LocalDate.of(2026, 5, 20), "900"));
        exchangeRateRepository.save(rate("USD", LocalDate.of(2026, 5, 22), "1000"));
    }

    @Test
    void portfolioLifecycleEndpoints() throws Exception {
        CreatedBuy createdBuy = createBuyTransaction();
        Long portfolioId = createdBuy.portfolioId();
        Long transactionId = createdBuy.transactionId();

        mockMvc.perform(get("/api/portfolio")
                        .header("Authorization", authorizationHeader())
                        .param("portfolioId", String.valueOf(portfolioId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.cashBalance").value(910000))
                .andExpect(jsonPath("$.summary.totalAssetValue").value(1010000))
                .andExpect(jsonPath("$.summary.positionCount").value(1))
                .andExpect(jsonPath("$.positions", hasSize(1)))
                .andExpect(jsonPath("$.recentTransactions", hasSize(2)));

        mockMvc.perform(get("/api/portfolio/summary")
                        .header("Authorization", authorizationHeader())
                        .param("portfolioId", String.valueOf(portfolioId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAssetValue").value(1010000))
                .andExpect(jsonPath("$.currencyValue").value(100000));

        mockMvc.perform(get("/api/portfolio/positions")
                        .header("Authorization", authorizationHeader())
                        .param("portfolioId", String.valueOf(portfolioId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].holdingForeignAmount").value(100));

        mockMvc.perform(get("/api/portfolio/positions/USD")
                        .header("Authorization", authorizationHeader())
                        .param("portfolioId", String.valueOf(portfolioId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.normalizedCurUnit").value("USD"))
                .andExpect(jsonPath("$.currentRate").value(1000));

        mockMvc.perform(get("/api/portfolio/transactions")
                        .header("Authorization", authorizationHeader())
                        .param("portfolioId", String.valueOf(portfolioId))
                        .param("curUnit", "USD")
                        .param("transactionType", "BUY")
                        .param("fromDate", "2026-05-01")
                        .param("toDate", "2026-05-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].transactionType").value("BUY"));

        mockMvc.perform(get("/api/exchange-rates/USD/rate")
                        .param("date", "2026-05-20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dealBasR").value(900));

        mockMvc.perform(get("/api/exchange-rates/USD/latest-rate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.baseDate").value("2026-05-22"))
                .andExpect(jsonPath("$.dealBasR").value(1000));

        mockMvc.perform(delete("/api/portfolio/transactions/{transactionId}", transactionId)
                        .header("Authorization", authorizationHeader()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/portfolio/transactions")
                        .header("Authorization", authorizationHeader())
                        .param("portfolioId", String.valueOf(portfolioId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].transactionType").value("DEPOSIT"));
    }

    @Test
    void sellCannotExceedHoldingAmount() throws Exception {
        CreatedBuy createdBuy = createBuyTransaction();

        mockMvc.perform(post("/api/portfolio/sell")
                        .header("Authorization", authorizationHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "portfolioId": %d,
                                  "curUnit": "USD",
                                  "foreignAmount": 200
                                }
                                """.formatted(createdBuy.portfolioId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Sell amount cannot exceed the current holding amount."));
    }

    private CreatedBuy createBuyTransaction() throws Exception {
        var accountResult = mockMvc.perform(post("/api/portfolio/account")
                        .header("Authorization", authorizationHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "KRW test portfolio",
                                  "investmentCurrency": "KRW",
                                  "initialDepositAmount": 1000000,
                                  "memo": "initial deposit"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cashBalance").value(1000000))
                .andReturn();
        Long portfolioId = objectMapper.readTree(accountResult.getResponse().getContentAsString()).get("id").asLong();

        var result = mockMvc.perform(post("/api/portfolio/buy")
                        .header("Authorization", authorizationHeader())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "portfolioId": %d,
                                  "curUnit": "USD",
                                  "transactionDate": "2026-05-20",
                                  "foreignAmount": 100,
                                  "memo": "first buy"
                                }
                                """.formatted(portfolioId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.curUnit").value("USD"))
                .andExpect(jsonPath("$.exchangeRate").value(900))
                .andReturn();

        Long transactionId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        return new CreatedBuy(portfolioId, transactionId);
    }

    private record CreatedBuy(Long portfolioId, Long transactionId) {
    }
}
