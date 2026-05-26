package com.leo.exchange.exchange_rate.client;

import com.leo.exchange.exchange_rate.config.ExchangeApiProperties;
import com.leo.exchange.exchange_rate.dto.ExchangeApiRateItem;
import com.leo.exchange.exchange_rate.exception.ExternalApiException;
import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import com.leo.exchange.exchange_rate.service.ExternalApiGuardService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Component
public class ExchangeApiClient {

    private static final DateTimeFormatter API_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final ExchangeApiProperties properties;
    private final ExternalApiGuardService guardService;
    private final RestClient restClient;

    public ExchangeApiClient(
            ExchangeApiProperties properties,
            ExternalApiGuardService guardService,
            RestClient.Builder restClientBuilder
    ) {
        this.properties = properties;
        this.guardService = guardService;
        this.restClient = restClientBuilder.baseUrl(properties.baseUrl()).build();
    }

    public List<ExchangeApiRateItem> fetchExchangeRates(LocalDate baseDate) {
        guardService.assertCallAllowed();
        if (!StringUtils.hasText(properties.authKey())) {
            throw new InvalidRequestException("EXCHANGE_API_KEY is required for exchange-rate synchronization.");
        }

        guardService.logApiCall(baseDate);
        try {
            ExchangeApiRateItem[] response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("authkey", properties.authKey())
                            .queryParam("searchdate", baseDate.format(API_DATE_FORMATTER))
                            .queryParam("data", "AP01")
                            .build())
                    .retrieve()
                    .body(ExchangeApiRateItem[].class);
            if (response == null) {
                return List.of();
            }
            return Arrays.asList(response);
        } catch (RestClientException ex) {
            log.error("Korea Eximbank API request failed. baseDate={}", baseDate, ex);
            throw new ExternalApiException("Failed to call Korea Eximbank exchange API.");
        }
    }
}
