package com.leo.exchange.exchange_rate.exception;

import org.springframework.http.HttpStatus;

public class InvalidRequestException extends BusinessException {

    public InvalidRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
