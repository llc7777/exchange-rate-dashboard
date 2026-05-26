package com.leo.exchange.exchange_rate.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "exchange.api")
public record ExchangeApiProperties(
        String authKey,
        String baseUrl
) {
}
