package com.leo.exchange.exchange_rate.exception;

import org.springframework.http.HttpStatus;

public class ExternalApiDailyLimitExceededException extends BusinessException {

    public ExternalApiDailyLimitExceededException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, message);
    }
}
