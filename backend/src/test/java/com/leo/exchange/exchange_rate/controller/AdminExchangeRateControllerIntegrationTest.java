package com.leo.exchange.exchange_rate.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import java.io.IOException;
import java.time.LocalDate;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

class AdminExchangeRateControllerIntegrationTest extends IntegrationTestSupport {

    private static final MockWebServer MOCK_WEB_SERVER = startServer();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ExchangeRateRepository exchangeRateRepository;

    @DynamicPropertySource
    static void registerMockServer(DynamicPropertyRegistry registry) {
        registry.add("exchange.api.base-url", () -> MOCK_WEB_SERVER.url("/site/program/financial/exchangeJSON").toString());
    }

    @AfterAll
    static void shutdownMockServer() throws IOException {
        MOCK_WEB_SERVER.shutdown();
    }

    @BeforeEach
    void setUp() {
        exchangeRateRepository.deleteAll();
    }

    @Test
    void syncDefaultEndpointCallsExternalApi() throws Exception {
        MOCK_WEB_SERVER.enqueue(successResponse("USD", "1350"));

        mockMvc.perform(post("/api/admin/exchange-rates/sync").param("date", "2026-05-24"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.savedCount").value(1))
                .andExpect(jsonPath("$.skipped").value(false));

        assertThat(exchangeRateRepository.findByNormalizedCurUnitAndBaseDate("USD", LocalDate.of(2026, 5, 24)))
                .isPresent();
    }

    @Test
    void forceFalseSkipsExternalApiWhenDateAlreadyExists() throws Exception {
        LocalDate date = LocalDate.of(2026, 5, 24);
        exchangeRateRepository.save(rate("USD", date, "1350"));
        int before = MOCK_WEB_SERVER.getRequestCount();

        mockMvc.perform(post("/api/admin/exchange-rates/sync")
                        .param("date", "2026-05-24")
                        .param("force", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skipped").value(true));

        assertThat(MOCK_WEB_SERVER.getRequestCount()).isEqualTo(before);
    }

    @Test
    void forceTrueCallsExternalApiEvenWhenDataAlreadyExists() throws Exception {
        LocalDate date = LocalDate.of(2026, 5, 24);
        exchangeRateRepository.save(rate("USD", date, "1300"));
        int before = MOCK_WEB_SERVER.getRequestCount();
        MOCK_WEB_SERVER.enqueue(successResponse("USD", "1350"));

        mockMvc.perform(post("/api/admin/exchange-rates/sync")
                        .param("date", "2026-05-24")
                        .param("force", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.savedCount").value(1));

        assertThat(MOCK_WEB_SERVER.getRequestCount()).isEqualTo(before + 1);
        assertThat(exchangeRateRepository.findByNormalizedCurUnitAndBaseDate("USD", date).orElseThrow().getDealBasR())
                .isEqualByComparingTo("1350");
    }

    private static MockWebServer startServer() {
        try {
            MockWebServer server = new MockWebServer();
            server.start();
            return server;
        } catch (IOException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private MockResponse successResponse(String curUnit, String dealBasR) {
        return new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody("""
                        [
                          {
                            "result": "1",
                            "cur_unit": "%s",
                            "cur_nm": "US Dollar",
                            "ttb": "1,340.00",
                            "tts": "1,360.00",
                            "deal_bas_r": "%s",
                            "bkpr": "%s",
                            "yy_efee_r": "0",
                            "ten_dd_efee_r": "0",
                            "kftc_deal_bas_r": "%s",
                            "kftc_bkpr": "%s"
                          }
                        ]
                        """.formatted(curUnit, dealBasR, dealBasR, dealBasR, dealBasR));
    }
}
