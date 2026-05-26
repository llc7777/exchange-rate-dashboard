package com.leo.exchange.exchange_rate.entity;

import java.math.BigDecimal;

public enum PortfolioChangeStatus {
    UP,
    DOWN,
    NO_CHANGE;

    public static PortfolioChangeStatus from(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return NO_CHANGE;
        }
        return amount.compareTo(BigDecimal.ZERO) > 0 ? UP : DOWN;
    }
}
