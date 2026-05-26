package com.leo.exchange.exchange_rate.controller;

import com.leo.exchange.exchange_rate.dto.ExchangeCalculateRequest;
import com.leo.exchange.exchange_rate.dto.ExchangeCalculateResponse;
import com.leo.exchange.exchange_rate.dto.ExchangeRateForTransactionResponse;
import com.leo.exchange.exchange_rate.dto.ExchangeRateHistoryResponse;
import com.leo.exchange.exchange_rate.dto.ExchangeRateResponse;
import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import com.leo.exchange.exchange_rate.service.ExchangeCalculatorService;
import com.leo.exchange.exchange_rate.service.ExchangeRateService;
import com.leo.exchange.exchange_rate.util.UserKeyResolver;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/exchange-rates")
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;
    private final ExchangeCalculatorService exchangeCalculatorService;
    private final UserKeyResolver userKeyResolver;

    @GetMapping("/today")
    public List<ExchangeRateResponse> getTodayRates() {
        return exchangeRateService.getTodayRates(userKeyResolver.currentUserKeyOrNull());
    }

    @GetMapping("/search")
    public List<ExchangeRateResponse> search(
            @RequestParam(required = false) String keyword
    ) {
        return exchangeRateService.search(keyword, userKeyResolver.currentUserKeyOrNull());
    }

    @GetMapping("/{curUnit}/history")
    public List<ExchangeRateHistoryResponse> getHistory(
            @PathVariable String curUnit,
            @RequestParam(required = false) Integer days
    ) {
        if (days != null) {
            throw new InvalidRequestException("days query parameter is not supported. History is fixed to the latest 7 stored records.");
        }
        return exchangeRateService.getHistory(curUnit);
    }

    @GetMapping("/{curUnit}/rate")
    public ExchangeRateForTransactionResponse getRateForTransaction(
            @PathVariable String curUnit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return exchangeRateService.getRateForTransaction(curUnit, date);
    }

    @GetMapping("/{curUnit}/latest-rate")
    public ExchangeRateForTransactionResponse getLatestRateForTransaction(@PathVariable String curUnit) {
        return exchangeRateService.getLatestRateForTransaction(curUnit);
    }

    @GetMapping("/{curUnit}")
    public ExchangeRateResponse getDetail(
            @PathVariable String curUnit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return exchangeRateService.getDetail(curUnit, date, userKeyResolver.currentUserKeyOrNull());
    }

    @PostMapping("/calculate")
    public ExchangeCalculateResponse calculate(@Valid @RequestBody ExchangeCalculateRequest request) {
        return exchangeCalculatorService.calculate(request);
    }
}
