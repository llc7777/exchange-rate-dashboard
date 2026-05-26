package com.leo.exchange.exchange_rate.exception;

import org.springframework.http.HttpStatus;

public class ExternalApiException extends BusinessException {

    public ExternalApiException(String message) {
        super(HttpStatus.BAD_GATEWAY, message);
    }
}
