package com.leo.exchange.exchange_rate.service;

import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import java.time.LocalDate;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExternalApiGuardService {

    private final ThreadLocal<ExternalApiCallerType> allowedCaller = new ThreadLocal<>();

    public <T> T executeAllowed(ExternalApiCallerType callerType, Supplier<T> supplier) {
        allowedCaller.set(callerType);
        try {
            return supplier.get();
        } finally {
            allowedCaller.remove();
        }
    }

    public void assertCallAllowed() {
        if (allowedCaller.get() == null) {
            throw new InvalidRequestException("External exchange API calls are allowed only for admin, scheduler, or portfolio rate sync.");
        }
    }

    public void logApiCall(LocalDate baseDate) {
        // 외부 API 호출 횟수를 추적할 수 있도록 호출 지점과 날짜를 로그로 남긴다.
        // Logs caller and date so external API usage can be tracked conservatively.
        log.info("Calling Korea Eximbank exchange API. caller={}, baseDate={}", allowedCaller.get(), baseDate);
    }
}
