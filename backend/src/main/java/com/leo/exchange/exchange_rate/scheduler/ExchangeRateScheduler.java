package com.leo.exchange.exchange_rate.scheduler;

import com.leo.exchange.exchange_rate.service.ExchangeRateSyncService;
import com.leo.exchange.exchange_rate.service.ExternalApiCallerType;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "exchange.scheduler", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ExchangeRateScheduler {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final ExchangeRateSyncService exchangeRateSyncService;

    @Scheduled(cron = "${exchange.scheduler.cron}", zone = "Asia/Seoul")
    public void syncDailyRates() {
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        try {
            exchangeRateSyncService.sync(today, false, ExternalApiCallerType.SCHEDULER);
        } catch (Exception ex) {
            log.warn("Scheduled exchange-rate sync failed. date={}", today, ex);
        }
    }
}
