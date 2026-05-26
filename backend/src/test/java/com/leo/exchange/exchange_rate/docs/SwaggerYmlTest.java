package com.leo.exchange.exchange_rate.docs;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class SwaggerYmlTest {

    private static final Path SWAGGER_PATH = Path.of("src/main/resources/swagger.yml");

    @Test
    void swaggerYmlExists() {
        assertThat(Files.exists(SWAGGER_PATH)).isTrue();
    }

    @Test
    void majorEndpointsAreDocumented() throws Exception {
        String swagger = Files.readString(SWAGGER_PATH);

        assertThat(swagger).contains("/api/auth/register");
        assertThat(swagger).contains("/api/auth/login");
        assertThat(swagger).contains("/api/auth/me");
        assertThat(swagger).contains("/api/exchange-rates/today");
        assertThat(swagger).contains("/api/exchange-rates/search");
        assertThat(swagger).contains("/api/exchange-rates/{curUnit}");
        assertThat(swagger).contains("/api/exchange-rates/{curUnit}/history");
        assertThat(swagger).contains("/api/exchange-rates/calculate");
        assertThat(swagger).contains("/api/favorites");
        assertThat(swagger).contains("/api/portfolio");
        assertThat(swagger).contains("/api/portfolio/account");
        assertThat(swagger).contains("/api/portfolio/deposits");
        assertThat(swagger).contains("/api/portfolio/buy");
        assertThat(swagger).contains("/api/portfolio/sell");
        assertThat(swagger).contains("/api/portfolio/transactions");
        assertThat(swagger).contains("/api/exchange-rates/{curUnit}/rate");
        assertThat(swagger).contains("/api/exchange-rates/{curUnit}/latest-rate");
        assertThat(swagger).contains("/api/admin/exchange-rates/sync");
        assertThat(swagger).doesNotContain("/api/target-alerts");
        assertThat(swagger).doesNotContain("PortfolioTransactionCreateRequest");
        assertThat(swagger).doesNotContain("PortfolioTransactionUpdateRequest");
    }

    @Test
    void schemasUseEnglishCamelCaseFields() throws Exception {
        String swagger = Files.readString(SWAGGER_PATH);

        assertThat(swagger).contains("curUnit:");
        assertThat(swagger).contains("normalizedCurUnit:");
        assertThat(swagger).contains("dealBasR:");
        assertThat(swagger).contains("convertedAmount:");
        assertThat(swagger).contains("accessToken:");
        assertThat(swagger).contains("investmentCurrency:");
        assertThat(swagger).contains("cashBalance:");
        assertThat(swagger).contains("totalAssetValue:");
        assertThat(swagger).doesNotContain("cashBalanceKrw:");
        assertThat(swagger).doesNotContain("totalAssetValueKrw:");
        assertThat(swagger).doesNotContain("cur_unit:");
        assertThat(swagger).doesNotContain("deal_bas_r:");
    }

    @Test
    void protectedEndpointsUseBearerAuth() throws Exception {
        String swagger = Files.readString(SWAGGER_PATH);

        assertThat(swagger).contains("bearerAuth:");
        assertThat(swagger).contains("scheme: bearer");
        assertThat(swagger).contains("X-USER-KEY");
        assertThat(swagger).contains("Defaults to demo-user when omitted.");
    }

    @Test
    void historyEndpointHasNoDaysParameterAndDocumentsExternalApiPolicy() throws Exception {
        String swagger = Files.readString(SWAGGER_PATH);
        String historySection = swagger.substring(
                swagger.indexOf("/api/exchange-rates/{curUnit}/history:"),
                swagger.indexOf("/api/exchange-rates/calculate:")
        );

        assertThat(historySection).doesNotContain("name: days");
        assertThat(historySection).contains("Returns the latest 7 stored exchange-rate records for the currency. This endpoint never calls the external Korea Eximbank API directly.");
        assertThat(historySection).contains("ExchangeRateHistoryResponse");
    }
}
