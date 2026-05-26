package com.leo.exchange.exchange_rate.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "exchange.cache")
public record ExchangeCacheProperties(
        Duration ttl
) {
}
