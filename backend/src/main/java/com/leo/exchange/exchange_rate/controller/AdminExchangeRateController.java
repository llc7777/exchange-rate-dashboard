package com.leo.exchange.exchange_rate.controller;

import com.leo.exchange.exchange_rate.dto.ExchangeSyncResponse;
import com.leo.exchange.exchange_rate.service.ExchangeRateSyncService;
import com.leo.exchange.exchange_rate.service.ExternalApiCallerType;

import java.time.LocalDate;
import java.time.ZoneId;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/exchange-rates")
public class AdminExchangeRateController {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");

    private final ExchangeRateSyncService exchangeRateSyncService;

    @PostMapping("/sync")
    public ExchangeSyncResponse sync(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        LocalDate baseDate = date != null ? date : LocalDate.now(SEOUL_ZONE);
        return exchangeRateSyncService.sync(baseDate, force, ExternalApiCallerType.ADMIN);
    }
}
