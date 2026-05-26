package com.leo.exchange.exchange_rate.service;

import com.leo.exchange.exchange_rate.cache.CacheService;
import com.leo.exchange.exchange_rate.client.ExchangeApiClient;
import com.leo.exchange.exchange_rate.dto.ExchangeApiRateItem;
import com.leo.exchange.exchange_rate.dto.ExchangeSyncResponse;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.exception.ExternalApiDailyLimitExceededException;
import com.leo.exchange.exchange_rate.exception.ExternalApiException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeRateSyncService {

    private final ExchangeApiClient exchangeApiClient;
    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyUnitService currencyUnitService;
    private final CacheService cacheService;
    private final ExternalApiGuardService externalApiGuardService;

    @Transactional
    public ExchangeSyncResponse sync(LocalDate baseDate, boolean force, ExternalApiCallerType callerType) {
        return externalApiGuardService.executeAllowed(callerType, () -> syncInternal(baseDate, force));
    }

    private ExchangeSyncResponse syncInternal(LocalDate baseDate, boolean force) {
        if (!force && exchangeRateRepository.existsByBaseDate(baseDate)) {
            return new ExchangeSyncResponse(baseDate, true, 0, "Exchange-rate data already exists. External API call skipped.");
        }

        List<ExchangeApiRateItem> apiItems = exchangeApiClient.fetchExchangeRates(baseDate);
        if (apiItems.isEmpty()) {
            log.info("No exchange-rate data returned from Korea Eximbank API. baseDate={}", baseDate);
            return new ExchangeSyncResponse(baseDate, false, 0, "No exchange-rate data returned.");
        }

        validateResultCodes(apiItems);

        List<ExchangeRate> savedRates = new ArrayList<>();
        for (ExchangeApiRateItem item : apiItems) {
            ExchangeRate saved = upsertRate(baseDate, item);
            savedRates.add(saved);
        }

        exchangeRateRepository.saveAll(savedRates);
        invalidateCaches(baseDate, savedRates);

        return new ExchangeSyncResponse(baseDate, false, savedRates.size(), "Exchange-rate data synchronized.");
    }

    private ExchangeRate upsertRate(LocalDate baseDate, ExchangeApiRateItem item) {
        String curUnit = item.curUnit();
        String normalizedCurUnit = currencyUnitService.normalize(curUnit);
        BigDecimal dealBasR = parseApiNumber(item.dealBasR());
        BigDecimal changeAmount = calculateChangeAmount(normalizedCurUnit, baseDate, dealBasR);
        BigDecimal changeRate = calculateChangeRate(normalizedCurUnit, baseDate, dealBasR, changeAmount);

        ExchangeRate rate = exchangeRateRepository.findByCurUnitAndBaseDate(curUnit, baseDate)
                .orElseGet(() -> ExchangeRate.builder()
                        .curUnit(curUnit)
                        .normalizedCurUnit(normalizedCurUnit)
                        .baseDate(baseDate)
                        .build());

        rate.updateRates(
                item.curName(),
                parseApiNumber(item.ttb()),
                parseApiNumber(item.tts()),
                dealBasR,
                parseApiNumber(item.bkpr()),
                parseApiNumber(item.yyEfeeR()),
                parseApiNumber(item.tenDdEfeeR()),
                parseApiNumber(item.kftcDealBasR()),
                parseApiNumber(item.kftcBkpr()),
                changeAmount,
                changeRate
        );
        return rate;
    }

    public BigDecimal parseApiNumber(String value) {
        if (!StringUtils.hasText(value) || "-".equals(value.trim())) {
            return null;
        }
        // 외부 API의 숫자 문자열에서 콤마를 제거하고 BigDecimal로 변환한다.
        // Removes commas from external API number strings and converts them to BigDecimal.
        return new BigDecimal(value.trim().replace(",", ""));
    }

    private BigDecimal calculateChangeAmount(String normalizedCurUnit, LocalDate baseDate, BigDecimal currentRate) {
        if (currentRate == null) {
            return BigDecimal.ZERO;
        }
        return exchangeRateRepository
                .findTopByNormalizedCurUnitAndBaseDateBeforeOrderByBaseDateDesc(normalizedCurUnit, baseDate)
                .filter(previous -> previous.getDealBasR() != null)
                .map(previous -> currentRate.subtract(previous.getDealBasR()))
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal calculateChangeRate(
            String normalizedCurUnit,
            LocalDate baseDate,
            BigDecimal currentRate,
            BigDecimal changeAmount
    ) {
        if (currentRate == null) {
            return BigDecimal.ZERO;
        }
        return exchangeRateRepository
                .findTopByNormalizedCurUnitAndBaseDateBeforeOrderByBaseDateDesc(normalizedCurUnit, baseDate)
                .map(ExchangeRate::getDealBasR)
                .filter(previousRate -> previousRate != null && previousRate.compareTo(BigDecimal.ZERO) != 0)
                .map(previousRate -> changeAmount
                        .divide(previousRate, 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)))
                .orElse(BigDecimal.ZERO);
    }

    private void validateResultCodes(List<ExchangeApiRateItem> apiItems) {
        apiItems.stream()
                .map(ExchangeApiRateItem::result)
                .filter(StringUtils::hasText)
                .filter(result -> !"1".equals(result))
                .findFirst()
                .ifPresent(this::throwByResultCode);
    }

    private void throwByResultCode(String result) {
        switch (result) {
            case "2" -> throw new ExternalApiException("Korea Eximbank API DATA code is invalid.");
            case "3" -> throw new ExternalApiException("Korea Eximbank API authentication key is invalid.");
            case "4" -> {
                log.warn("Korea Eximbank API daily limit exceeded.");
                throw new ExternalApiDailyLimitExceededException("Korea Eximbank API daily request limit has been exceeded.");
            }
            default -> throw new ExternalApiException("Korea Eximbank API returned an unknown result code: " + result);
        }
    }

    private void invalidateCaches(LocalDate baseDate, List<ExchangeRate> savedRates) {
        cacheService.evict(ExchangeRateService.todayCacheKey());
        for (ExchangeRate savedRate : savedRates) {
            cacheService.evict(ExchangeRateService.detailCacheKey(savedRate.getNormalizedCurUnit(), baseDate));
            cacheService.evict(ExchangeRateService.historyCacheKey(savedRate.getNormalizedCurUnit()));
        }
        // 환율 동기화 후 포트폴리오 평가는 최신 영업일 환율로 다시 계산되어야 한다.
        // Portfolio valuation must be recalculated from the latest business-day rates after sync.
        cacheService.evictByPattern("portfolio:*");
    }
}
