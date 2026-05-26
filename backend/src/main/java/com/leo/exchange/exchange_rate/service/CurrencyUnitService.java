package com.leo.exchange.exchange_rate.service;

import java.math.BigDecimal;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class CurrencyUnitService {

    private static final BigDecimal HUNDRED_UNIT_FACTOR = BigDecimal.valueOf(100);
    private static final BigDecimal DEFAULT_UNIT_FACTOR = BigDecimal.ONE;

    public String normalize(String curUnit) {
        if (!StringUtils.hasText(curUnit)) {
            return "";
        }
        String trimmed = curUnit.trim().toUpperCase(Locale.ROOT);
        int unitMarkerIndex = trimmed.indexOf('(');
        if (unitMarkerIndex > 0) {
            return trimmed.substring(0, unitMarkerIndex);
        }
        return trimmed;
    }

    public BigDecimal getUnitFactor(String curUnit) {
        if (!StringUtils.hasText(curUnit)) {
            return DEFAULT_UNIT_FACTOR;
        }
        String normalized = curUnit.trim().toUpperCase(Locale.ROOT);
        // JPY(100), IDR(100)처럼 100단위 고시 통화는 계산 기준 단위를 100으로 분리한다.
        // For quoted currencies such as JPY(100) and IDR(100), separates the unit factor as 100.
        if (normalized.contains("(100)")) {
            return HUNDRED_UNIT_FACTOR;
        }
        return DEFAULT_UNIT_FACTOR;
    }
}
