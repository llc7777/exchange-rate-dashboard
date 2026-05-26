package com.leo.exchange.exchange_rate.dto;

import java.time.LocalDate;

public record ExchangeSyncResponse(
        LocalDate baseDate,
        boolean skipped,
        int savedCount,
        String message
) {
}
