package com.leo.exchange.exchange_rate.exception;

import org.springframework.http.HttpStatus;

public class DataNotFoundException extends BusinessException {

    public DataNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
