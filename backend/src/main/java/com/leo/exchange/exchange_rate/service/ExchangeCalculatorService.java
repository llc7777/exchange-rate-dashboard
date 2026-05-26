package com.leo.exchange.exchange_rate.service;

import com.leo.exchange.exchange_rate.dto.ExchangeCalculateRequest;
import com.leo.exchange.exchange_rate.dto.ExchangeCalculateResponse;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.exception.DataNotFoundException;
import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExchangeCalculatorService {

    private static final String KRW = "KRW";
    private static final MathContext CALCULATION_CONTEXT = MathContext.DECIMAL64;

    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyUnitService currencyUnitService;

    public ExchangeCalculateResponse calculate(ExchangeCalculateRequest request) {
        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("Amount must be greater than zero.");
        }

        String fromCurrency = currencyUnitService.normalize(request.fromCurrency());
        String toCurrency = currencyUnitService.normalize(request.toCurrency());
        BigDecimal fromRate = getRatePerSingleUnit(fromCurrency);
        BigDecimal toRate = getRatePerSingleUnit(toCurrency);

        // KRW 기준 환율로 환산한 뒤 대상 통화의 단위 환율로 나눈다.
        // Converts through KRW as the base currency and divides by the target currency rate per unit.
        BigDecimal appliedRate = fromRate.divide(toRate, 10, RoundingMode.HALF_UP);
        BigDecimal convertedAmount = request.amount()
                .multiply(appliedRate, CALCULATION_CONTEXT)
                .setScale(4, RoundingMode.HALF_UP)
                .stripTrailingZeros();

        return new ExchangeCalculateResponse(
                fromCurrency,
                toCurrency,
                request.amount(),
                convertedAmount,
                appliedRate.stripTrailingZeros()
        );
    }

    private BigDecimal getRatePerSingleUnit(String normalizedCurrency) {
        if (KRW.equals(normalizedCurrency)) {
            return BigDecimal.ONE;
        }

        ExchangeRate rate = exchangeRateRepository.findTopByNormalizedCurUnitOrderByBaseDateDesc(normalizedCurrency)
                .orElseThrow(() -> new DataNotFoundException("Exchange rate not found for " + normalizedCurrency + "."));
        if (rate.getDealBasR() == null || rate.getDealBasR().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("Invalid exchange rate for " + normalizedCurrency + ".");
        }
        return rate.getDealBasR().divide(currencyUnitService.getUnitFactor(rate.getCurUnit()), 10, RoundingMode.HALF_UP);
    }
}
